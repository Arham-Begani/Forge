-- 007_billing.sql
-- Billing, subscriptions, payments, credits, and idempotent webhook tracking.

CREATE TABLE IF NOT EXISTS billing_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_slug TEXT NOT NULL CHECK (plan_slug IN ('free', 'builder', 'pro', 'studio')),
  billing_period TEXT NOT NULL CHECK (billing_period IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'trialing', 'active', 'past_due', 'canceled', 'expired')),
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_subscription_id TEXT UNIQUE,
  provider_plan_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  credits_per_cycle INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'razorpay',
  kind TEXT NOT NULL CHECK (kind IN ('subscription', 'topup')),
  plan_slug TEXT CHECK (plan_slug IN ('free', 'builder', 'pro', 'studio')),
  topup_slug TEXT CHECK (topup_slug IN ('topup-50', 'topup-175')),
  provider_order_id TEXT,
  provider_payment_id TEXT UNIQUE,
  provider_signature TEXT,
  amount_inr INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL CHECK (status IN ('created', 'authorized', 'captured', 'failed', 'refunded')),
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS credit_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('monthly_grant', 'topup', 'usage', 'manual_adjustment')),
  credits INTEGER NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  conversation_id UUID NOT NULL UNIQUE REFERENCES conversations(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL CHECK (module_id IN (
    'research',
    'branding',
    'marketing',
    'landing',
    'feasibility',
    'full-launch',
    'general',
    'shadow-board',
    'investor-kit',
    'launch-autopilot',
    'mvp-scalpel'
  )),
  credits INTEGER NOT NULL,
  plan_slug TEXT NOT NULL CHECK (plan_slug IN ('free', 'builder', 'pro', 'studio')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL UNIQUE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions(user_id, status, current_period_end DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user_created_at ON payments(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_ledger_user_created_at ON credit_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_ledger_user_created_at ON usage_ledger(user_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_ledger_monthly_grant_payment ON credit_ledger(payment_id, kind) WHERE kind = 'monthly_grant';
CREATE UNIQUE INDEX IF NOT EXISTS idx_credit_ledger_topup_payment ON credit_ledger(payment_id, kind) WHERE kind = 'topup';

CREATE OR REPLACE FUNCTION update_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_billing_customers_updated_at ON billing_customers;
CREATE TRIGGER trg_billing_customers_updated_at
  BEFORE UPDATE ON billing_customers
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

DROP TRIGGER IF EXISTS trg_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated_at ON payments;
CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_updated_at();

ALTER TABLE billing_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own billing customer" ON billing_customers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own payments" ON payments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own credit ledger" ON credit_ledger
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own usage ledger" ON usage_ledger
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
