-- 020: Reduce free tokens from 500 to 300 (enough for 4 posts at most expensive theme)
-- Most expensive: magazine + product mode = 75 tokens
-- 4 posts × 75 = 300 tokens

-- Cap existing users who have more than 300 free tokens
UPDATE sf_user_credits
SET free_tokens = 300
WHERE free_tokens > 300;
