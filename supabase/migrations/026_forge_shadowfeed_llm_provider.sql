ALTER TABLE sf_shadowfeed_config ADD COLUMN IF NOT EXISTS llm_provider TEXT DEFAULT 'openai';
