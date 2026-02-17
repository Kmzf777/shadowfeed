-- ============================================================================
-- Migration 023: Plan Prices Table for Stripe Integration
-- Creates a table with one row per plan×cycle×currency combo.
-- Each row has a stripe_price_id column for you to fill in after creating
-- the corresponding price in Stripe Dashboard.
-- ============================================================================

-- 1. Plan Prices table
CREATE TABLE IF NOT EXISTS sf_subscription_plan_prices (
  id TEXT PRIMARY KEY,                              -- e.g. 'starter_monthly_usd'
  plan_id TEXT NOT NULL REFERENCES sf_subscription_plans(id),
  billing_cycle TEXT NOT NULL,                       -- 'monthly', 'quarterly', 'annual'
  currency TEXT NOT NULL,                            -- 'usd', 'brl'
  unit_price NUMERIC(10,2) NOT NULL,                -- price per billing period (total)
  price_per_month NUMERIC(10,2) NOT NULL,           -- effective monthly price
  discount_percent INTEGER NOT NULL DEFAULT 0,       -- 0, 10, 20
  stripe_price_id TEXT,                              -- fill this in from Stripe Dashboard
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, billing_cycle, currency)
);

-- 2. Seed all plan × cycle × currency combinations
-- BRL rate: ~5.80 USD/BRL

-- ── Starter ($9.99/mo) ──
INSERT INTO sf_subscription_plan_prices (id, plan_id, billing_cycle, currency, unit_price, price_per_month, discount_percent) VALUES
  ('starter_monthly_usd',    'starter', 'monthly',   'usd',  9.99,   9.99,  0),
  ('starter_monthly_brl',    'starter', 'monthly',   'brl',  57.90,  57.90, 0),
  ('starter_quarterly_usd',  'starter', 'quarterly', 'usd',  26.97,  8.99,  10),
  ('starter_quarterly_brl',  'starter', 'quarterly', 'brl',  156.33, 52.11, 10),
  ('starter_annual_usd',     'starter', 'annual',    'usd',  95.90,  7.99,  20),
  ('starter_annual_brl',     'starter', 'annual',    'brl',  555.84, 46.32, 20)
ON CONFLICT (id) DO NOTHING;

-- ── Micro-Operation ($19.99/mo) ──
INSERT INTO sf_subscription_plan_prices (id, plan_id, billing_cycle, currency, unit_price, price_per_month, discount_percent) VALUES
  ('micro-operation_monthly_usd',    'micro-operation', 'monthly',   'usd',  19.99,   19.99,  0),
  ('micro-operation_monthly_brl',    'micro-operation', 'monthly',   'brl',  115.90,  115.90, 0),
  ('micro-operation_quarterly_usd',  'micro-operation', 'quarterly', 'usd',  53.97,   17.99,  10),
  ('micro-operation_quarterly_brl',  'micro-operation', 'quarterly', 'brl',  312.93,  104.31, 10),
  ('micro-operation_annual_usd',     'micro-operation', 'annual',    'usd',  191.90,  15.99,  20),
  ('micro-operation_annual_brl',     'micro-operation', 'annual',    'brl',  1112.64, 92.72,  20)
ON CONFLICT (id) DO NOTHING;

-- ── Booster Mode ($39.99/mo) ──
INSERT INTO sf_subscription_plan_prices (id, plan_id, billing_cycle, currency, unit_price, price_per_month, discount_percent) VALUES
  ('booster-mode_monthly_usd',    'booster-mode', 'monthly',   'usd',  39.99,   39.99,  0),
  ('booster-mode_monthly_brl',    'booster-mode', 'monthly',   'brl',  231.90,  231.90, 0),
  ('booster-mode_quarterly_usd',  'booster-mode', 'quarterly', 'usd',  107.97,  35.99,  10),
  ('booster-mode_quarterly_brl',  'booster-mode', 'quarterly', 'brl',  626.13,  208.71, 10),
  ('booster-mode_annual_usd',     'booster-mode', 'annual',    'usd',  383.90,  31.99,  20),
  ('booster-mode_annual_brl',     'booster-mode', 'annual',    'brl',  2226.24, 185.52, 20)
ON CONFLICT (id) DO NOTHING;

-- 3. RLS
ALTER TABLE sf_subscription_plan_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read plan prices"
  ON sf_subscription_plan_prices
  FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to plan prices"
  ON sf_subscription_plan_prices
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Also update the base sf_subscription_plans tokens (in case 021 wasn't run yet)
UPDATE sf_subscription_plans SET tokens_per_month = 1000 WHERE id = 'starter' AND tokens_per_month != 1000;
UPDATE sf_subscription_plans SET tokens_per_month = 2000 WHERE id = 'micro-operation' AND tokens_per_month != 2000;
UPDATE sf_subscription_plans SET tokens_per_month = 4000 WHERE id = 'booster-mode' AND tokens_per_month != 4000;
