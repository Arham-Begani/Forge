-- Atomic counter + upsert RPCs for the Auto-GTM layer.
-- These replace racy SELECT-then-UPDATE patterns across tracking routes.
-- Migration: 014_campaign_rpcs.sql

-- ─── increment_campaign_metric ───────────────────────────────────────────────
-- Atomically increments a named integer column on `campaigns`.
-- Whitelist of allowed column names prevents SQL injection via the metric arg.
CREATE OR REPLACE FUNCTION increment_campaign_metric(
  p_campaign_id UUID,
  p_metric      TEXT
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF p_metric NOT IN (
    'sent_count','opened_count','clicked_count',
    'replied_count','bounced_count','unsubscribed_count'
  ) THEN
    RAISE EXCEPTION 'invalid metric: %', p_metric;
  END IF;

  EXECUTE format(
    'UPDATE campaigns SET %I = COALESCE(%I, 0) + 1, updated_at = NOW() WHERE id = $1',
    p_metric, p_metric
  ) USING p_campaign_id;
END;
$$;

-- ─── increment_gmail_daily_count ─────────────────────────────────────────────
-- Atomically bumps per-user send count and rolls the day over if needed.
CREATE OR REPLACE FUNCTION increment_gmail_daily_count(
  p_user_id UUID
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE gmail_integrations
  SET
    daily_sent_count = CASE
      WHEN daily_count_reset_at = CURRENT_DATE THEN COALESCE(daily_sent_count, 0) + 1
      ELSE 1
    END,
    daily_count_reset_at = CURRENT_DATE,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

-- ─── upsert_campaign_analytics ───────────────────────────────────────────────
-- Single-query upsert with server-side accumulation. Replaces racy read-mod-write.
CREATE OR REPLACE FUNCTION upsert_campaign_analytics(
  p_campaign_id UUID,
  p_date        DATE,
  p_sent        INTEGER DEFAULT 0,
  p_opened      INTEGER DEFAULT 0,
  p_clicked     INTEGER DEFAULT 0,
  p_replied     INTEGER DEFAULT 0,
  p_bounced     INTEGER DEFAULT 0
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO campaign_analytics (
    campaign_id, date, sent, opened, clicked, replied, bounced,
    open_rate, click_rate, reply_rate
  )
  VALUES (
    p_campaign_id, p_date, p_sent, p_opened, p_clicked, p_replied, p_bounced,
    CASE WHEN p_sent > 0 THEN p_opened::float / p_sent ELSE 0 END,
    CASE WHEN p_sent > 0 THEN p_clicked::float / p_sent ELSE 0 END,
    CASE WHEN p_sent > 0 THEN p_replied::float / p_sent ELSE 0 END
  )
  ON CONFLICT (campaign_id, date) DO UPDATE SET
    sent    = campaign_analytics.sent    + EXCLUDED.sent,
    opened  = campaign_analytics.opened  + EXCLUDED.opened,
    clicked = campaign_analytics.clicked + EXCLUDED.clicked,
    replied = campaign_analytics.replied + EXCLUDED.replied,
    bounced = campaign_analytics.bounced + EXCLUDED.bounced,
    open_rate  = CASE WHEN (campaign_analytics.sent + EXCLUDED.sent) > 0
                       THEN (campaign_analytics.opened  + EXCLUDED.opened )::float
                            / (campaign_analytics.sent + EXCLUDED.sent)
                       ELSE 0 END,
    click_rate = CASE WHEN (campaign_analytics.sent + EXCLUDED.sent) > 0
                       THEN (campaign_analytics.clicked + EXCLUDED.clicked)::float
                            / (campaign_analytics.sent + EXCLUDED.sent)
                       ELSE 0 END,
    reply_rate = CASE WHEN (campaign_analytics.sent + EXCLUDED.sent) > 0
                       THEN (campaign_analytics.replied + EXCLUDED.replied)::float
                            / (campaign_analytics.sent + EXCLUDED.sent)
                       ELSE 0 END;
END;
$$;

-- Needed for ON CONFLICT target above.
CREATE UNIQUE INDEX IF NOT EXISTS uq_campaign_analytics_campaign_date
  ON campaign_analytics(campaign_id, date);

-- ─── rate_limit_events ───────────────────────────────────────────────────────
-- Sliding-window rate limiter backing store. Single table, indexed by (user, key).
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id         BIGSERIAL PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_key  TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE rate_limit_events RENAME COLUMN key TO event_key;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_rate_limit_events_user_key_time
  ON rate_limit_events(user_id, event_key, created_at DESC);

-- Helper: count events in window and insert a new one atomically. Returns the
-- new count so callers can decide to 429 based on the response.
CREATE OR REPLACE FUNCTION record_rate_limit_event(
  p_user_id    UUID,
  p_key        TEXT,
  p_window_sec INTEGER,
  p_limit      INTEGER
) RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
AS $$
  WITH event_count AS (
    SELECT COUNT(*)::INTEGER AS count_value
    FROM rate_limit_events
    WHERE user_id = p_user_id
      AND event_key = p_key
      AND created_at > NOW() - (p_window_sec || ' seconds')::interval
  ),
  inserted AS (
    INSERT INTO rate_limit_events (user_id, event_key)
    SELECT p_user_id, p_key
    WHERE (SELECT count_value FROM event_count) < p_limit
    RETURNING 1
  ),
  cleaned AS (
    DELETE FROM rate_limit_events
    WHERE user_id = p_user_id
      AND event_key = p_key
      AND created_at < NOW() - (p_window_sec * 4 || ' seconds')::interval
    RETURNING 1
  )
  SELECT CASE
    WHEN (SELECT count_value FROM event_count) >= p_limit
      THEN (SELECT count_value FROM event_count)
    ELSE (SELECT count_value FROM event_count) + 1
  END;
$$;
