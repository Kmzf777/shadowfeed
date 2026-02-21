-- Migration: 025_posts_content_type
-- Adds content type and depth tracking to sf_posts for rotation logic

ALTER TABLE sf_posts
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS depth_level TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sf_posts_depth_level_check'
  ) THEN
    ALTER TABLE sf_posts
      ADD CONSTRAINT sf_posts_depth_level_check
      CHECK (depth_level IN ('shallow', 'balanced', 'dense'));
  END IF;
END $$;

-- Existing posts with NULL content_type are treated as legacy — no action needed
