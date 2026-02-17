-- ============================================================================
-- Migration 021: Multi-Model Token System
-- Introduces LLM model registry, dynamic system config, and updated pricing.
-- ============================================================================

-- 1. LLM Model Registry
CREATE TABLE IF NOT EXISTS sf_llm_models (
  id TEXT PRIMARY KEY,                          -- 'marketing-friend', 'copywriter', 'shadowfeed'
  display_name TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openai',       -- 'openai', 'google', 'anthropic', etc.
  model_id TEXT NOT NULL,                        -- e.g. 'gpt-4.1-mini', 'gpt-4.1', 'gpt-5-mini'
  input_cost_per_1m NUMERIC(10,4) NOT NULL,      -- USD per 1M input tokens
  output_cost_per_1m NUMERIC(10,4) NOT NULL,     -- USD per 1M output tokens
  tier_order INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  max_output_tokens INTEGER DEFAULT 8192,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed models
INSERT INTO sf_llm_models (id, display_name, provider, model_id, input_cost_per_1m, output_cost_per_1m, tier_order, description, active, max_output_tokens) VALUES
  ('marketing-friend', 'Marketing Friend', 'openai', 'gpt-4.1-mini', 0.40, 1.60, 1,
   'Fast and affordable. Great for high-volume content creation with solid quality.', true, 8192),
  ('copywriter', 'Copywriter', 'openai', 'gpt-4.1', 2.00, 8.00, 2,
   'Premium quality writing. Best for high-stakes content that needs to convert.', true, 8192),
  ('shadowfeed', 'ShadowFeed', 'openai', 'gpt-5-mini', 2.00, 8.00, 3,
   'Our most advanced model. Coming soon with cutting-edge capabilities.', false, 8192)
ON CONFLICT (id) DO NOTHING;

-- 2. System Config (key-value store for dynamic settings)
CREATE TABLE IF NOT EXISTS sf_system_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO sf_system_config (key, value, description) VALUES
  ('tokens_per_usd_cost', '850', 'ShadowFeed tokens charged per $1 of real API cost'),
  ('free_tokens_initial', '160', 'Free tokens granted to new users'),
  ('free_tokens_drip_amount', '25', 'Tokens added per drip cycle'),
  ('free_tokens_drip_interval_days', '4', 'Days between free token drips'),
  ('free_tokens_max_balance', '160', 'Maximum free token balance'),
  ('extra_token_price_usd', '0.012', 'Price per extra token in USD')
ON CONFLICT (key) DO NOTHING;

-- 3. Update subscription plan token allocations
UPDATE sf_subscription_plans SET tokens_per_month = 1000 WHERE id = 'starter';
UPDATE sf_subscription_plans SET tokens_per_month = 2000 WHERE id = 'micro-operation';
UPDATE sf_subscription_plans SET tokens_per_month = 4000 WHERE id = 'booster-mode';

-- 4. Add LLM model tracking columns to sf_posts
ALTER TABLE sf_posts
  ADD COLUMN IF NOT EXISTS llm_model_id TEXT,
  ADD COLUMN IF NOT EXISTS llm_model_name TEXT,
  ADD COLUMN IF NOT EXISTS llm_provider TEXT DEFAULT 'openai',
  ADD COLUMN IF NOT EXISTS estimated_tokens INTEGER,
  ADD COLUMN IF NOT EXISTS actual_tokens INTEGER;

-- 5. Add llm_model_id to credit transactions
ALTER TABLE sf_credit_transactions
  ADD COLUMN IF NOT EXISTS llm_model_id TEXT;

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_sf_posts_llm_model_id ON sf_posts(llm_model_id);
CREATE INDEX IF NOT EXISTS idx_sf_posts_created_at ON sf_posts(created_at);
CREATE INDEX IF NOT EXISTS idx_sf_credit_transactions_llm_model_id ON sf_credit_transactions(llm_model_id);

-- 7. RLS for new tables
ALTER TABLE sf_llm_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active LLM models"
  ON sf_llm_models
  FOR SELECT
  USING (true);

CREATE POLICY "Service role full access to LLM models"
  ON sf_llm_models
  FOR ALL
  USING (true)
  WITH CHECK (true);

ALTER TABLE sf_system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to system config"
  ON sf_system_config
  FOR ALL
  USING (true)
  WITH CHECK (true);
