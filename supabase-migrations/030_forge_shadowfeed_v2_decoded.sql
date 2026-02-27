-- Migration: 030_forge_shadowfeed_v2_decoded
-- Pillar System v2: 5 pillars (BrandsDecoded proportions), new metadata columns, cadence table
-- Story: FSD-01

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Expand pillar_id constraint on sf_shadowfeed_queue (new + legacy IDs)
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE sf_shadowfeed_queue
  DROP CONSTRAINT IF EXISTS sf_shadowfeed_queue_pillar_id_check;

ALTER TABLE sf_shadowfeed_queue
  ADD CONSTRAINT sf_shadowfeed_queue_pillar_id_check
  CHECK (pillar_id IN (
    -- v2 pillars
    'educational-value', 'wake-up-slap', 'brand-breakdown', 'proof-social', 'the-offer',
    -- legacy (backward compat)
    'proof-of-machine', 'shadow-school'
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Add new metadata columns to sf_shadowfeed_queue
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE sf_shadowfeed_queue
  ADD COLUMN IF NOT EXISTS hook_archetype TEXT CHECK (hook_archetype IS NULL OR hook_archetype IN (
    'direct-controversy', 'specific-number', 'transformative-promise',
    'polarization', 'curiosity-mystery', 'brand-comparison'
  )),
  ADD COLUMN IF NOT EXISTS funnel_tier TEXT CHECK (funnel_tier IS NULL OR funnel_tier IN (
    'top', 'middle', 'bottom'
  )),
  ADD COLUMN IF NOT EXISTS double_door_seed JSONB;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Add same columns to sf_posts
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE sf_posts
  ADD COLUMN IF NOT EXISTS hook_archetype TEXT CHECK (hook_archetype IS NULL OR hook_archetype IN (
    'direct-controversy', 'specific-number', 'transformative-promise',
    'polarization', 'curiosity-mystery', 'brand-comparison'
  )),
  ADD COLUMN IF NOT EXISTS funnel_tier TEXT CHECK (funnel_tier IS NULL OR funnel_tier IN (
    'top', 'middle', 'bottom'
  )),
  ADD COLUMN IF NOT EXISTS double_door_seed JSONB;

-- Also expand pillar_id on sf_posts if it has a constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'sf_posts_pillar_id_check'
  ) THEN
    ALTER TABLE sf_posts DROP CONSTRAINT sf_posts_pillar_id_check;
    ALTER TABLE sf_posts ADD CONSTRAINT sf_posts_pillar_id_check
      CHECK (pillar_id IS NULL OR pillar_id IN (
        'educational-value', 'wake-up-slap', 'brand-breakdown', 'proof-social', 'the-offer',
        'proof-of-machine', 'shadow-school'
      ));
  END IF;
END $$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Create sf_shadowfeed_cadence table (weekly tracking)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sf_shadowfeed_cadence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  pillar_id TEXT NOT NULL CHECK (pillar_id IN (
    'educational-value', 'wake-up-slap', 'brand-breakdown', 'proof-social', 'the-offer'
  )),
  target_count INTEGER NOT NULL DEFAULT 0,
  actual_count INTEGER NOT NULL DEFAULT 0,
  proportion_target NUMERIC(4,2) NOT NULL DEFAULT 0,
  proportion_actual NUMERIC(4,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (week_start, pillar_id)
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Index on cadence week_start
-- ─────────────────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_sf_cadence_week_start ON sf_shadowfeed_cadence(week_start);

-- Drop the unique index that constrains to old pillar IDs (pillar_id, scheduled_date)
-- and recreate it so new pillar IDs can also be unique per date
-- (The existing index already handles this since it's on generic text columns, no change needed)
