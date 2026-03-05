-- Migration 035: Create sf_user_blog_sources
-- Story: RU-01 (Recon Ultra — DB Migrations)
-- PRD Reference: § 7.2

CREATE TABLE sf_user_blog_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blog_url TEXT NOT NULL,
    blog_name TEXT,
    scrape_frequency TEXT DEFAULT 'daily' CHECK (scrape_frequency IN ('hourly', 'daily', 'weekly')),
    last_scraped_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_user_blog UNIQUE (user_id, blog_url),
    CONSTRAINT max_url_length CHECK (char_length(blog_url) <= 500)
);

CREATE INDEX idx_user_blogs_active
    ON sf_user_blog_sources(user_id, is_active)
    WHERE is_active = TRUE;

-- RLS
ALTER TABLE sf_user_blog_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own blog sources"
    ON sf_user_blog_sources FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
    ON sf_user_blog_sources FOR ALL
    USING (auth.role() = 'service_role');
