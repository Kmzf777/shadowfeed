-- ============================================================================
-- Migration 022: Migrate Existing Users to New Token Economy
-- Scales existing token balances to match new plan allocations.
-- ============================================================================

-- 1. Scale active subscription tokens_allocated to new values
-- Starter: 1800 -> 1000, Micro-Op: 3600 -> 2000, Booster: 7200 -> 4000
-- Ratio is ~0.556 for all plans

UPDATE sf_user_subscriptions
SET
  tokens_allocated = CASE
    WHEN plan_id = 'starter' THEN 1000
    WHEN plan_id = 'micro-operation' THEN 2000
    WHEN plan_id = 'booster-mode' THEN 4000
    ELSE tokens_allocated
  END,
  -- Scale tokens_used proportionally, cap at new allocation
  tokens_used = LEAST(
    ROUND(tokens_used * 0.556),
    CASE
      WHEN plan_id = 'starter' THEN 1000
      WHEN plan_id = 'micro-operation' THEN 2000
      WHEN plan_id = 'booster-mode' THEN 4000
      ELSE tokens_allocated
    END
  )
WHERE status IN ('active', 'past_due');

-- 2. Scale free tokens (max 160, proportional from 300)
UPDATE sf_user_credits
SET free_tokens = LEAST(ROUND(free_tokens * 0.533), 160)
WHERE free_tokens > 0;

-- 3. Scale extra tokens by purchasing power ratio
-- Old: $0.007/token, New: $0.012/token
-- To preserve USD value: new_tokens = old_tokens * (0.007 / 0.012) = old_tokens * 0.583
UPDATE sf_user_credits
SET extra_tokens = ROUND(extra_tokens * 0.583)
WHERE extra_tokens > 0;
