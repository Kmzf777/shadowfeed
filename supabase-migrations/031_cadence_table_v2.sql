-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 031: Alter sf_shadowfeed_cadence for weekly cadence system (FSD-06)
-- ─────────────────────────────────────────────────────────────────────────────
-- The v2 cadence system tracks per-day-of-week generation history.
-- Old schema had aggregate counters; new schema tracks individual generation events.

-- Drop old unique constraint and columns that are no longer needed
ALTER TABLE sf_shadowfeed_cadence
  DROP CONSTRAINT IF EXISTS sf_shadowfeed_cadence_week_start_pillar_id_key;

-- Add new columns
ALTER TABLE sf_shadowfeed_cadence
  ADD COLUMN IF NOT EXISTS day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  ADD COLUMN IF NOT EXISTS hook_archetype TEXT,
  ADD COLUMN IF NOT EXISTS funnel_tier TEXT CHECK (funnel_tier IN ('top', 'middle', 'bottom')),
  ADD COLUMN IF NOT EXISTS queue_item_id UUID REFERENCES sf_shadowfeed_queue(id);

-- Drop old aggregate columns (safe — they were never populated in production)
ALTER TABLE sf_shadowfeed_cadence
  DROP COLUMN IF EXISTS target_count,
  DROP COLUMN IF EXISTS actual_count,
  DROP COLUMN IF EXISTS proportion_target,
  DROP COLUMN IF EXISTS proportion_actual;

-- New unique constraint: one record per day per week
ALTER TABLE sf_shadowfeed_cadence
  ADD CONSTRAINT uq_cadence_week_day UNIQUE (week_start, day_of_week);

-- Index for queue_item_id lookups
CREATE INDEX IF NOT EXISTS idx_sf_cadence_queue_item ON sf_shadowfeed_cadence(queue_item_id);
