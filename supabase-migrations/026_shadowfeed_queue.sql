-- Migration: 026_shadowfeed_queue
-- Queue table for ShadowFeed content engine (4 pillars/day)
-- Also adds generation_method column to sf_posts for system-generated posts

CREATE TABLE IF NOT EXISTS sf_shadowfeed_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pillar_id TEXT NOT NULL CHECK (pillar_id IN (
    'wake-up-slap', 'proof-of-machine', 'shadow-school', 'the-offer'
  )),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'generating', 'ready', 'approved', 'posting', 'posted', 'failed'
  )),
  post_id UUID REFERENCES sf_posts(id),
  theme_used TEXT NOT NULL DEFAULT 'shadowfeed-brand',
  discovery_source JSONB,
  template_used TEXT,
  generation_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sf_queue_date ON sf_shadowfeed_queue(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_sf_queue_status ON sf_shadowfeed_queue(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_sf_queue_unique ON sf_shadowfeed_queue(pillar_id, scheduled_date);

-- AC10: Add generation_method to sf_posts for system-generated posts (user_id = NULL)
ALTER TABLE sf_posts
  ADD COLUMN IF NOT EXISTS generation_method TEXT;
