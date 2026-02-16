-- ============================================================================
-- Migration 017: Subscription System
-- Adds subscription plans, user subscriptions, and modifies credit tables
-- for the new token-based subscription model.
-- ============================================================================

-- 1. Subscription Plans (reference data)
CREATE TABLE IF NOT EXISTS sf_subscription_plans (
  id TEXT PRIMARY KEY,                    -- 'starter', 'micro-operation', 'booster-mode'
  name TEXT NOT NULL,
  tokens_per_month INTEGER NOT NULL,
  price_usd NUMERIC(10,2) NOT NULL,
  price_brl NUMERIC(10,2) NOT NULL,
  stripe_price_id_usd TEXT,              -- Stripe recurring price ID (USD)
  stripe_price_id_brl TEXT,              -- Stripe recurring price ID (BRL)
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed subscription plans
INSERT INTO sf_subscription_plans (id, name, tokens_per_month, price_usd, price_brl) VALUES
  ('starter',         'Starter',         1800, 9.99,  57.90),
  ('micro-operation', 'Micro-Operation', 3600, 19.99, 115.90),
  ('booster-mode',    'Booster Mode',    7200, 39.99, 231.90)
ON CONFLICT (id) DO NOTHING;

-- 2. User Subscriptions
CREATE TABLE IF NOT EXISTS sf_user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id TEXT REFERENCES sf_subscription_plans(id) NOT NULL,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',    -- active, canceled, past_due, paused
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  tokens_allocated INTEGER NOT NULL,        -- tokens for current period
  tokens_used INTEGER NOT NULL DEFAULT 0,   -- tokens consumed this period
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Indexes for sf_user_subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON sf_user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON sf_user_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_sub_id ON sf_user_subscriptions(stripe_subscription_id);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_subscription_updated_at
  BEFORE UPDATE ON sf_user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- 3. Add extra_tokens column to sf_user_credits
ALTER TABLE sf_user_credits
  ADD COLUMN IF NOT EXISTS extra_tokens INTEGER DEFAULT 0;

-- 4. Add token_source column to sf_credit_transactions
ALTER TABLE sf_credit_transactions
  ADD COLUMN IF NOT EXISTS token_source TEXT DEFAULT 'plan';
-- Valid values: 'plan', 'extra'

-- 5. RLS Policies for new tables

-- sf_subscription_plans: readable by everyone
ALTER TABLE sf_subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read subscription plans"
  ON sf_subscription_plans
  FOR SELECT
  USING (true);

-- sf_user_subscriptions: users can read their own
ALTER TABLE sf_user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription"
  ON sf_user_subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to subscriptions"
  ON sf_user_subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);
