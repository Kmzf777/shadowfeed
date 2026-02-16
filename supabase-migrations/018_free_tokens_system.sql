-- 018: Free Tokens System
-- Adds free_tokens column and drip tracking to sf_user_credits

ALTER TABLE sf_user_credits ADD COLUMN IF NOT EXISTS free_tokens INTEGER DEFAULT 0;
ALTER TABLE sf_user_credits ADD COLUMN IF NOT EXISTS last_free_drip TIMESTAMPTZ DEFAULT now();

-- Grant initial 500 free tokens to all existing users who have 0
UPDATE sf_user_credits SET free_tokens = 500 WHERE free_tokens = 0;
