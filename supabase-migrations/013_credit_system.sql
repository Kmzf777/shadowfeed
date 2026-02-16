-- ============================================================
-- Migration 013: Credit System
-- Adds user credits balance and transaction history
-- ============================================================

-- 1. User Credits Balance
CREATE TABLE IF NOT EXISTS sf_user_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_purchased INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 2. Credit Transactions Log
CREATE TABLE IF NOT EXISTS sf_credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'spend', 'refund', 'bonus')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  post_id UUID REFERENCES sf_posts(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  package_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Add credits_used column to sf_posts if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'sf_posts' AND column_name = 'credits_used'
  ) THEN
    ALTER TABLE sf_posts ADD COLUMN credits_used INTEGER;
  END IF;
END $$;

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON sf_user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON sf_credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON sf_credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_type ON sf_credit_transactions(type);

-- 5. Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_user_credits_updated_at ON sf_user_credits;
CREATE TRIGGER trigger_update_user_credits_updated_at
  BEFORE UPDATE ON sf_user_credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 6. RLS Policies
ALTER TABLE sf_user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own credits
CREATE POLICY "Users can view own credits"
  ON sf_user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their own transactions
CREATE POLICY "Users can view own transactions"
  ON sf_credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (backend uses service role key)
CREATE POLICY "Service role full access on credits"
  ON sf_user_credits FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on transactions"
  ON sf_credit_transactions FOR ALL
  USING (true)
  WITH CHECK (true);
