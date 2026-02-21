-- Migration: 024_setup_v2_user_profile
-- Adds strategic profile fields for Content Engine v2.0

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS niche TEXT,
  ADD COLUMN IF NOT EXISTS expertise_statement TEXT,
  ADD COLUMN IF NOT EXISTS transformation_before TEXT,
  ADD COLUMN IF NOT EXISTS transformation_after TEXT,
  ADD COLUMN IF NOT EXISTS audience_frustration TEXT,
  ADD COLUMN IF NOT EXISTS audience_desire TEXT,
  ADD COLUMN IF NOT EXISTS audience_objection TEXT,
  ADD COLUMN IF NOT EXISTS audience_awareness TEXT DEFAULT 'solution_aware',
  ADD COLUMN IF NOT EXISTS content_pillars TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS primary_goal TEXT DEFAULT 'balanced',
  ADD COLUMN IF NOT EXISTS content_depth TEXT DEFAULT 'balanced',
  ADD COLUMN IF NOT EXISTS posting_frequency TEXT DEFAULT '2-3_week',
  ADD COLUMN IF NOT EXISTS avoid_topics TEXT,
  ADD COLUMN IF NOT EXISTS brand_personality TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS offers JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS setup_version INTEGER DEFAULT 1;

-- Add CHECK constraints (only if column was just created — safe to run again)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_primary_goal_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_primary_goal_check
      CHECK (primary_goal IN ('grow_audience','generate_leads','direct_sales','build_authority','balanced'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_audience_awareness_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_audience_awareness_check
      CHECK (audience_awareness IN ('unaware','problem_aware','solution_aware','brand_aware','most_aware'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_content_depth_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_content_depth_check
      CHECK (content_depth IN ('shallow','balanced','dense'));
  END IF;
END $$;
