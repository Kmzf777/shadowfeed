-- Migration: 027_shadowfeed_config
-- Singleton config for ShadowFeed engine

CREATE TABLE IF NOT EXISTS sf_shadowfeed_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  publish_enabled BOOLEAN DEFAULT false,
  pillars JSONB DEFAULT '[
    {"id": "wake-up-slap", "time": "09:00", "active": true},
    {"id": "proof-of-machine", "time": "13:00", "active": true},
    {"id": "shadow-school", "time": "17:00", "active": true},
    {"id": "the-offer", "time": "20:00", "active": true}
  ]'::jsonb,
  theme_brand_ratio NUMERIC DEFAULT 0.7,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default config row (idempotent)
INSERT INTO sf_shadowfeed_config (id) VALUES ('default')
  ON CONFLICT (id) DO NOTHING;
