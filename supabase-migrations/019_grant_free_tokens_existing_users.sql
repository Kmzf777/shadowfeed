-- 019: Grant 500 free tokens to all existing users (enough for ~10 posts)
-- Avg cost per post: ~50 tokens (minimalist=40, twitter=40, educational=50, magazine=65)
-- 500 tokens / 50 avg = ~10 posts

UPDATE sf_user_credits
SET free_tokens = 500,
    last_free_drip = now()
WHERE free_tokens < 500;
