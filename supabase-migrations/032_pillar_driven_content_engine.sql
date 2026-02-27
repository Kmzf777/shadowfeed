-- Migration: 032_pillar_driven_content_engine
-- Story: PDCE-01 — Pillar System Foundation
-- Adds pillar_id and hook_archetype columns to sf_posts

ALTER TABLE sf_posts ADD COLUMN IF NOT EXISTS pillar_id TEXT;
ALTER TABLE sf_posts ADD COLUMN IF NOT EXISTS hook_archetype TEXT;

CREATE INDEX IF NOT EXISTS idx_sf_posts_pillar_id ON sf_posts(pillar_id);
CREATE INDEX IF NOT EXISTS idx_sf_posts_user_pillar ON sf_posts(user_id, pillar_id);
