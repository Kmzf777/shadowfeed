-- Migration 036: Create sf_recon_query_cache
-- Story: RU-01 (Recon Ultra — DB Migrations)
-- PRD Reference: § 7.3

CREATE TABLE sf_recon_query_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pillar_id TEXT NOT NULL CHECK (pillar_id IN ('educate', 'provoke', 'prove', 'connect', 'convert')),
    queries JSONB NOT NULL,
    profile_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),

    CONSTRAINT unique_user_pillar_cache UNIQUE (user_id, pillar_id)
);

CREATE INDEX idx_query_cache_lookup
    ON sf_recon_query_cache(user_id, pillar_id, expires_at);
