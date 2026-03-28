-- 009_marketing_automation.sql
-- Connected channels, marketing assets, publish jobs, and RLS hardening.

CREATE TABLE IF NOT EXISTS social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'linkedin')),
  provider_account_id TEXT NOT NULL,
  provider_account_label TEXT NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'reauth_required')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venture_id UUID NOT NULL REFERENCES public.ventures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'linkedin')),
  asset_type TEXT NOT NULL CHECK (asset_type IN ('youtube_video', 'linkedin_post')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'scheduled', 'publishing', 'published', 'failed', 'needs_reauth')),
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  provider_asset_id TEXT,
  provider_permalink TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_publish_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID NOT NULL REFERENCES public.marketing_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'linkedin')),
  run_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed', 'cancelled', 'needs_reauth')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS marketing_publish_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.marketing_publish_jobs(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES public.marketing_assets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('youtube', 'linkedin')),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error_message TEXT,
  provider_response JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_social_connections_user_provider ON social_connections(user_id, provider);
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_connections_active_provider
  ON social_connections(user_id, provider)
  WHERE status <> 'revoked';
CREATE INDEX IF NOT EXISTS idx_marketing_assets_venture_provider_status ON marketing_assets(venture_id, provider, status);
CREATE INDEX IF NOT EXISTS idx_marketing_publish_jobs_status_run_at ON marketing_publish_jobs(status, run_at);
CREATE INDEX IF NOT EXISTS idx_marketing_publish_attempts_asset_created_at ON marketing_publish_attempts(asset_id, created_at DESC);

CREATE OR REPLACE FUNCTION update_marketing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_social_connections_updated_at ON social_connections;
CREATE TRIGGER trg_social_connections_updated_at
  BEFORE UPDATE ON social_connections
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_marketing_assets_updated_at ON marketing_assets;
CREATE TRIGGER trg_marketing_assets_updated_at
  BEFORE UPDATE ON marketing_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_updated_at();

DROP TRIGGER IF EXISTS trg_marketing_publish_jobs_updated_at ON marketing_publish_jobs;
CREATE TRIGGER trg_marketing_publish_jobs_updated_at
  BEFORE UPDATE ON marketing_publish_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_marketing_updated_at();

ALTER TABLE public.ventures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_publish_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_publish_attempts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ventures" ON public.ventures;
CREATE POLICY "Users can manage own ventures" ON public.ventures
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own conversations" ON public.conversations;
CREATE POLICY "Users can manage own conversations" ON public.conversations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.ventures
      WHERE ventures.id = conversations.venture_id
        AND ventures.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.ventures
      WHERE ventures.id = conversations.venture_id
        AND ventures.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can manage own social connections" ON public.social_connections;
CREATE POLICY "Users can manage own social connections" ON public.social_connections
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own marketing assets" ON public.marketing_assets;
CREATE POLICY "Users can manage own marketing assets" ON public.marketing_assets
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own marketing publish jobs" ON public.marketing_publish_jobs;
CREATE POLICY "Users can manage own marketing publish jobs" ON public.marketing_publish_jobs
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own marketing publish attempts" ON public.marketing_publish_attempts;
CREATE POLICY "Users can manage own marketing publish attempts" ON public.marketing_publish_attempts
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);
