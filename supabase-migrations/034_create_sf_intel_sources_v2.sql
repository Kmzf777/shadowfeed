-- Migration 034: Create sf_intel_sources_v2
-- Story: RU-01 (Recon Ultra — DB Migrations)
-- PRD Reference: § 7.1

CREATE TABLE sf_intel_sources_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN (
        'google_news', 'google_trends', 'reddit', 'twitter', 'blog'
    )),
    pillar_tag TEXT CHECK (pillar_tag IN (
        'educate', 'provoke', 'prove', 'connect', 'convert'
    )),

    -- Content
    title TEXT NOT NULL,
    summary TEXT,
    body_content TEXT,
    url TEXT,
    author TEXT,
    category TEXT,

    -- Engagement metrics
    source_score NUMERIC(6,1),
    source_comments INTEGER,
    source_retweets INTEGER,
    source_views INTEGER,

    -- Scoring (5 dimensions + final)
    relevance_score NUMERIC(4,2) DEFAULT 5.0 CHECK (relevance_score BETWEEN 0 AND 10),
    pillar_alignment_score NUMERIC(4,2) CHECK (pillar_alignment_score BETWEEN 0 AND 10),
    recency_score NUMERIC(4,2) CHECK (recency_score BETWEEN 0 AND 10),
    engagement_score NUMERIC(4,2) CHECK (engagement_score BETWEEN 0 AND 10),
    richness_score NUMERIC(4,2) CHECK (richness_score BETWEEN 0 AND 10),
    final_score NUMERIC(4,2) CHECK (final_score BETWEEN 0 AND 15),

    -- Metadata
    query_used TEXT,
    posted_at TIMESTAMPTZ,
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    -- Usage tracking
    used BOOLEAN DEFAULT FALSE,
    used_in_post_id UUID REFERENCES sf_posts(id),
    used_at TIMESTAMPTZ,

    CONSTRAINT sf_intel_v2_title_min CHECK (char_length(title) >= 5)
);

-- Per-user unused intel, sorted by score
CREATE INDEX idx_intel_v2_user_unused
    ON sf_intel_sources_v2(user_id, used, final_score DESC)
    WHERE used = FALSE;

-- Per-user + pillar lookup (Stage 0 cache query)
CREATE INDEX idx_intel_v2_user_pillar
    ON sf_intel_sources_v2(user_id, pillar_tag, final_score DESC)
    WHERE used = FALSE;

-- TTL cleanup
CREATE INDEX idx_intel_v2_expires
    ON sf_intel_sources_v2(expires_at)
    WHERE expires_at < NOW();

-- Dedup by URL per user
CREATE UNIQUE INDEX idx_intel_v2_dedup
    ON sf_intel_sources_v2(user_id, url)
    WHERE url IS NOT NULL;

-- RLS
ALTER TABLE sf_intel_sources_v2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own intel"
    ON sf_intel_sources_v2 FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
    ON sf_intel_sources_v2 FOR ALL
    USING (auth.role() = 'service_role');
