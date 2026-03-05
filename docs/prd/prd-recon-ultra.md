# RECON ULTRA — Profile-Aware Intelligence Engine — PRD

> **Feature Codename:** RECON-ULTRA
> **Type:** Backend overhaul + new module (brownfield)
> **Status:** Draft — Ready for Review
> **Author:** @pm (Morgan) · Analysis by @analyst (Atlas)
> **Date:** 2026-03-04
> **Document optimized for execution via Claude Code.**

---

## Table of Contents

1. [Background & Diagnosis](#1-background--diagnosis)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Target Users](#3-target-users)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [Schema & Data Model](#7-schema--data-model)
8. [API Endpoints](#8-api-endpoints)
9. [Scope](#9-scope)
10. [Dependencies & Risks](#10-dependencies--risks)
11. [Epic Breakdown](#11-epic-breakdown)
12. [Acceptance Criteria by Epic](#12-acceptance-criteria-by-epic)
13. [Verification Plan](#13-verification-plan)

---

## 1. Background & Diagnosis

### 1.1 Current State — 7 Structural Flaws

The existing Recon system (`src/modules/recon/`) was built as a generic AI-news collector. It operates independently of user profiles and the Pillar System, making it fundamentally incompatible with ShadowFeed's personalized content generation model.

| # | Flaw | Severity | File |
|---|------|----------|------|
| F1 | Keywords hardcoded in `.env` (`GOOGLE_TRENDS_KEYWORDS`) — all users get identical intel | CRITICAL | `sources/trends.source.ts` |
| F2 | RSS feeds fixed to 3 AI-specific queries — useless for non-AI niches | CRITICAL | `sources/news.source.ts` |
| F3 | Categories locked to 7 AI-only values (`ai_models`, `ai_tools`, etc.) | HIGH | `recon.types.ts` |
| F4 | Recon disconnected from Forge-Smart — duplicated fetch effort, zero cache reuse | HIGH | `recon.service.ts` / `forge-smart.service.ts` |
| F5 | No blog scraping capability — missing the richest source for educational content | HIGH | N/A (doesn't exist) |
| F6 | Relevance scoring uses AI-specific regex (`chatgpt/openai/gemini`) — irrelevant for 90% of niches | MEDIUM | `sources/news.source.ts:scoreRelevance()` |
| F7 | No Pillar System integration — collects everything equally, no content-type awareness | MEDIUM | `recon.service.ts` |

### 1.2 Current vs. Desired

| Dimension | Current Recon | Recon Ultra |
|-----------|---------------|-------------|
| **Query source** | `.env` hardcoded | User profile V2 + Pillar config |
| **Personalization** | Zero — same for all users | Per-user queries, scoring, and cache |
| **Sources** | 5 generic (news, trends×2, reddit, twitter) | 5 dynamic + blog scraper |
| **Categories** | 7 fixed AI-only | Dynamic per user niche |
| **Scoring** | AI-keyword regex | Profile-keyword TF-IDF + pillar weights |
| **Pillar awareness** | None | Full — pillar-tagged intel with weighted scoring |
| **Blog scraping** | None | Playwright + stealth + Readability.js |
| **Forge-Smart link** | Disconnected | Stage 0 cache check before live fetch |
| **Storage** | `sf_intel_sources` (global) | `sf_intel_sources_v2` (per-user, pillar-tagged) |
| **TTL** | Fixed 5 days | Smart: 24h social, 72h blogs, 7d data/research |

### 1.3 Why This Matters

ShadowFeed is a **personalized** content engine. The intelligence layer that feeds it must also be personalized. A fitness coach and a SaaS founder cannot share the same intel pipeline. The current system forces them to, resulting in:

- Low relevance scores across non-AI niches
- Forge-Smart re-fetching everything live (wasting time and API calls)
- Zero blog content — the richest source for educational/prove pillar content
- No pillar-aware ranking — an educational article scores the same as a provocative tweet

---

## 2. Goals & Success Metrics

### 2.1 Goals

| # | Goal | Rationale |
|---|------|-----------|
| G1 | Eliminate hardcoded keywords — all queries derived from user profile + pillar | Enables true personalization |
| G2 | Add blog scraping with Playwright stealth | Unlocks richest content source for educate/prove pillars |
| G3 | Integrate Recon cache with Forge-Smart (Stage 0) | Eliminates duplicate fetches, reduces latency |
| G4 | Implement pillar-aware scoring and tagging | Content ranked by pillar alignment, not just engagement |
| G5 | Per-user intel storage with smart TTL | Prevents cross-user contamination, auto-cleanup |

### 2.2 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Forge-Smart cache hit rate | >= 40% of generations use cached intel | SQL: `WHERE generation_source = 'cache'` |
| Relevance score (non-AI niches) | Average >= 6.5/10 | SQL: `AVG(relevance_score) WHERE niche != 'AI'` |
| Blog content availability | >= 30% of intel items are `source_type = 'blog'` | SQL count by source_type |
| Forge-Smart latency reduction | >= 25% faster when cache hit | Log: `totalMs` comparison |
| Pillar distribution accuracy | Within ±10% of pillar proportions | SQL: `COUNT(*) GROUP BY pillar_tag` |

---

## 3. Target Users

- **Primary:** ShadowFeed users with completed V2 profile (niche, audience_frustration, audience_desire)
- **Secondary:** ShadowFeed users with V1 profile (target_audience, main_pain_point) — degraded but functional
- **Tertiary:** Admin users triggering manual recon runs

---

## 4. Functional Requirements

### FR-QRY: Profile-Aware Query Generation

#### FR-QRY-01: Dynamic Query Builder

The system MUST generate search queries using the user's profile fields and the selected pillar's `queryAngles[]`.

**Input fields consumed from user profile (V2 preferred, V1 fallback):**

| V2 Field | V1 Fallback | Usage |
|----------|-------------|-------|
| `niche` | (none — use `target_audience`) | Core search context |
| `target_audience` | `target_audience` | Audience qualifier |
| `audience_frustration` | `main_pain_point` | Pain-point angle |
| `audience_desire` | (none) | Aspiration angle |
| `expertise_statement` | `user_prompt` | Authority context |
| `content_pillars[]` | (none) | Topic boundaries |
| `avoid_topics` | (none) | Negative filter |

**Query generation rules:**
- Use Gemini 2.5 Flash (existing `src/config/gemini.ts` config)
- Generate exactly `pillarConfig.queryAngles.length` queries (3-7 per pillar)
- Each query MUST be <= 10 words, English only
- Each query MUST map to one `queryAngle` from the pillar
- Queries MUST NOT overlap with `avoid_topics`
- Cache generated queries for 24h per user+pillar combination

#### FR-QRY-02: Query Caching

Store generated queries in `sf_recon_query_cache` to avoid redundant Gemini calls.

| Field | Type | Description |
|-------|------|-------------|
| `user_id` | UUID | Owner |
| `pillar_id` | TEXT | Pillar that generated the queries |
| `queries` | JSONB | Array of query strings |
| `profile_hash` | TEXT | SHA-256 of profile fields used — invalidates cache on profile edit |
| `created_at` | TIMESTAMPTZ | When generated |
| `expires_at` | TIMESTAMPTZ | `created_at + 24h` |

---

### FR-SRC: Dynamic Source Adapters

#### FR-SRC-01: Google News Dynamic

Replace the 3 hardcoded AI RSS feeds with dynamic query-based RSS fetching.

- URL pattern: `https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en`
- One RSS fetch per generated query
- Max 8 items per query
- Scoring: profile-keyword TF-IDF (not AI-regex)
- Reuse existing `rss-parser` dependency

#### FR-SRC-02: Google Trends Dynamic

Replace `env.GOOGLE_TRENDS_KEYWORDS` with profile-derived keywords.

- Extract top 5 keywords from: `niche + target_audience + content_pillars[]`
- Use existing `google-trends-api` library
- Geo: derive from user locale (default: US)
- Category: auto-detect from niche (not hardcoded `ai_tools`)

#### FR-SRC-03: Reddit Dynamic

Replace `env.REDDIT_SUBREDDITS` with subreddit discovery.

- Use Reddit search API to find subreddits matching user's niche
- Cache discovered subreddits for 7 days per user
- Fetch `.getHot({ limit: 15 })` per discovered subreddit
- Filter: score >= 50, not stickied (same as current)
- Store discovered subreddits in `sf_recon_subreddit_cache`

#### FR-SRC-04: Twitter Dynamic

Replace `env.TWITTER_SEARCH_QUERIES` and `env.TWITTER_PROFILES` with profile-derived queries.

- Use the same generated queries from FR-QRY-01 (with pillar context)
- Keep existing TwitterAPI.io integration (`smart-content-fetcher.ts` pattern)
- Filter: likeCount >= 20 OR retweetCount >= 5 (same as current)
- Thread enrichment: same logic as current `fetchTweetThread()`

#### FR-SRC-05: Blog Scraper (NEW)

New source type that scrapes blog articles using Playwright with stealth capabilities.

**Discovery methods (in priority order):**

1. **User-configured blog URLs** — from `sf_user_blog_sources` table
2. **Google News RSS** — articles from RSS that link to blog domains
3. **Sitemap parsing** — fetch `/sitemap.xml` from configured blogs, extract recent article URLs

**Extraction pipeline:**

```
URL → Playwright (stealth) → Wait for hydration → Extract via:
  1. @mozilla/readability (primary — clean article extraction)
  2. CSS selectors: article, [role="main"], main, .post-content (fallback)
  3. Largest text block heuristic (last resort)
```

**Anti-bot measures:**
- `playwright-extra` + `puppeteer-extra-plugin-stealth` (already used in `twitter.source.ts`)
- Random User-Agent rotation (desktop pool of 5 UAs)
- Random delay between requests: 2-5 seconds
- Cookie consent auto-dismiss (common selectors)
- Max 3 concurrent browser pages
- Rate limit: max 3 requests/minute per domain

**Extracted data:**
- `title` — from h1 or og:title
- `body_content` — clean article text (max 5000 chars)
- `author` — from meta[name="author"] or byline patterns
- `posted_at` — from meta[property="article:published_time"] or datePublished schema
- `word_count` — computed from body
- `key_quotes` — blockquote elements + bold/italic emphasis (max 5)

**Content quality filter:**
- Reject if body < 300 chars (too thin)
- Reject if body > 80% navigation/menu text (failed extraction)
- Reject if title matches PR patterns (same editorial filter as Forge-Smart)

---

### FR-SCR: Profile-Aware Scoring Engine

#### FR-SCR-01: Unified Scoring Algorithm

All sources scored with the same 5-dimension algorithm:

| Dimension | Range | Computation |
|-----------|-------|-------------|
| **Recency** | 0-10 | Same tiers as current: <6h→10, <24h→8, <48h→6, <7d→4, else→2 |
| **Engagement** | 0-10 | Same tiers as current: >5000→10, >1000→8, etc. |
| **Relevance** | 0-10 | **NEW**: TF-IDF against profile keywords (replaces AI-regex) |
| **Richness** | 0-10 | Same as current + bonus for `body_content` presence (+3) |
| **Pillar Alignment** | 0-10 | **NEW**: Gemini micro-classification against pillar description |

**New Relevance Score (TF-IDF):**

```
keywords = extractProfileKeywords(niche, target_audience, audience_frustration, expertise_statement)
For each candidate:
  matchCount = count of keywords found in (title + summary + body_content)
  matchRatio = matchCount / keywords.length
  relevance = matchRatio * 10
  + bonus: 0.5 per stats signal (numbers, percentages)
  + bonus: 0.5 per credibility signal (study, research, data)
  - penalty: 2.0 for PR fluff
```

**New Pillar Alignment Score:**

```
Use Gemini 2.5 Flash with structured output:
Input: candidate title + first 200 chars of summary
Output: { pillar_scores: { educate: 0-10, provoke: 0-10, prove: 0-10, connect: 0-10, convert: 0-10 } }
Take score for the target pillar.
Cache result per candidate URL for 72h.
```

**Final score formula:**

```
finalScore = (recency × pillarWeights.recency)
           + (engagement × pillarWeights.engagement)
           + (relevance × pillarWeights.relevance)
           + (richness × pillarWeights.richness)
           + (pillarAlignment × 0.15)  ← NEW fixed weight
           × sourceMultiplier[source_type]
```

**Updated source multipliers (add blog):**

| Pillar | google_news | reddit | twitter | blog |
|--------|-------------|--------|---------|------|
| educate | 1.5 | 1.0 | 0.8 | **1.8** |
| provoke | 0.8 | 1.2 | 1.5 | **0.6** |
| prove | 1.0 | 1.5 | 0.8 | **1.5** |
| connect | 0.5 | 1.5 | 1.3 | **0.7** |
| convert | 1.3 | 0.8 | 1.2 | **1.4** |

#### FR-SCR-02: Pillar Auto-Tagger

After scoring, each intel item receives a `pillar_tag` = the pillar with highest pillar_alignment_score. This enables Forge-Smart Stage 0 cache lookup by pillar.

---

### FR-STR: Per-User Intel Storage

#### FR-STR-01: New Table `sf_intel_sources_v2`

Per-user, pillar-tagged intel with enriched body content and smart TTL. Full schema in [Section 7](#7-schema--data-model).

#### FR-STR-02: Smart TTL

Different content types expire at different rates:

| Source Type | TTL | Rationale |
|-------------|-----|-----------|
| twitter | 24h | Social content ages fastest |
| reddit | 48h | Discussion threads stay relevant slightly longer |
| google_news | 72h | News articles have moderate shelf life |
| google_trends | 24h | Trends are ephemeral by definition |
| blog | 7 days | Long-form content stays relevant longest |

Expired items cleaned by a scheduled job (cron or Supabase pg_cron).

#### FR-STR-03: Deduplication

Before inserting, check `(user_id, url)` uniqueness. If duplicate found and new `final_score > existing.final_score`, update the existing row.

---

### FR-INT: Forge-Smart Integration

#### FR-INT-01: Stage 0 — Cache Lookup

Before Forge-Smart's current Stage 1 (query generation), insert a new **Stage 0**:

```
Stage 0: CHECK RECON CACHE
  Query: sf_intel_sources_v2
    WHERE user_id = $userId
    AND pillar_tag = $pillarId
    AND used = FALSE
    AND expires_at > NOW()
    ORDER BY final_score DESC
    LIMIT 10

  IF count >= 3 AND top_candidate.final_score >= 7.0:
    → CACHE HIT: skip Stages 1-2, go directly to Stage 3 (scoring) with cached candidates
    → Log: generation_source = 'cache'
  ELSE:
    → CACHE MISS: proceed with current Stages 1-3 (live fetch)
    → After fetch: save all candidates to sf_intel_sources_v2 for future cache
```

#### FR-INT-02: Forge-Smart Writes Back

When Forge-Smart performs a live fetch (cache miss), save all scored candidates to `sf_intel_sources_v2` so future requests can use cache.

#### FR-INT-03: Mark Used Intel

When Forge-Smart selects a winner from cache, update:
```sql
UPDATE sf_intel_sources_v2
SET used = TRUE, used_in_post_id = $postId, used_at = NOW()
WHERE id = $intelId;
```

---

### FR-BLOG: User Blog Source Management

#### FR-BLOG-01: Blog Source CRUD

Users can manage their preferred blog sources:

| Operation | Endpoint | Description |
|-----------|----------|-------------|
| Add | `POST /api/recon-ultra/blog-sources` | Add a blog URL to scrape |
| List | `GET /api/recon-ultra/blog-sources` | List user's configured blogs |
| Remove | `DELETE /api/recon-ultra/blog-sources/:id` | Remove a blog source |
| Toggle | `PATCH /api/recon-ultra/blog-sources/:id` | Enable/disable a source |

**Validation on add:**
- URL must be valid HTTPS
- Must return HTTP 200 on HEAD request
- Max 10 blog sources per user
- Must not be a social media URL (twitter, reddit, instagram, tiktok)

#### FR-BLOG-02: Blog Discovery Suggestions

When a user completes V2 setup, suggest 3-5 blog sources based on their niche using a Gemini prompt:

```
Given niche: "{niche}", suggest 5 authoritative blog URLs that publish content about this topic.
Return JSON: { blogs: [{ url: string, name: string, reason: string }] }
```

These are presented as suggestions — user must confirm before adding.

---

## 5. Non-Functional Requirements

### NFR-PERF: Performance

| Requirement | Target |
|-------------|--------|
| NFR-PERF-01: Full recon run (all sources, 1 user, 1 pillar) | <= 45 seconds |
| NFR-PERF-02: Blog scraping (single article) | <= 15 seconds |
| NFR-PERF-03: Forge-Smart Stage 0 cache lookup | <= 200ms |
| NFR-PERF-04: Query generation (Gemini call) | <= 5 seconds |
| NFR-PERF-05: Concurrent blog scraping | Max 3 pages simultaneously |

### NFR-RES: Resource Usage

| Requirement | Target |
|-------------|--------|
| NFR-RES-01: Playwright browser memory | <= 512MB per instance |
| NFR-RES-02: Max concurrent Playwright instances | 2 |
| NFR-RES-03: Gemini API calls per user per day | <= 5 (query gen + pillar classification) |
| NFR-RES-04: sf_intel_sources_v2 rows per user | <= 500 (enforced by TTL cleanup) |

### NFR-REL: Reliability

| Requirement | Target |
|-------------|--------|
| NFR-REL-01: Source failure isolation | One source failing MUST NOT block others |
| NFR-REL-02: Playwright crash recovery | Browser process killed after 30s timeout |
| NFR-REL-03: Graceful degradation | If all sources fail, Forge-Smart falls back to current live-fetch |

### NFR-SEC: Security

| Requirement | Target |
|-------------|--------|
| NFR-SEC-01: RLS on sf_intel_sources_v2 | Users can only read their own intel |
| NFR-SEC-02: Blog URLs validated | No SSRF — reject private IPs, localhost, internal domains |
| NFR-SEC-03: Scraped content sanitized | Strip scripts, iframes, event handlers before storage |

---

## 6. Technical Architecture

### 6.1 Module Structure

```
src/modules/recon-ultra/
├── recon-ultra.types.ts              # Type definitions
├── recon-ultra.service.ts            # Pipeline orchestrator (5 stages)
├── recon-ultra.controller.ts         # HTTP endpoints
├── recon-query-builder.ts            # FR-QRY-01: Gemini query generation
├── profile-scorer.ts                 # FR-SCR-01: TF-IDF relevance scoring
├── pillar-tagger.ts                  # FR-SCR-02: Gemini pillar classification
└── sources/
    ├── news-dynamic.source.ts        # FR-SRC-01: Google News by query
    ├── trends-dynamic.source.ts      # FR-SRC-02: Google Trends by profile keywords
    ├── reddit-dynamic.source.ts      # FR-SRC-03: Reddit with subreddit discovery
    ├── twitter-dynamic.source.ts     # FR-SRC-04: Twitter by profile queries
    └── blog.source.ts                # FR-SRC-05: Playwright blog scraper
```

**Modified existing files:**

```
src/modules/forge-smart/
├── forge-smart.service.ts            # ADD Stage 0 cache lookup (FR-INT-01)
├── forge-smart.types.ts              # ADD 'blog' to source_type union
└── smart-content-scorer.ts           # ADD blog source weight support

src/shared/types/
├── pillar.types.ts                   # ADD 'blog' to SourceType union
└── global.types.ts                   # ADD ReconUltra types

src/modules/pillar-system/
└── pillar-configs.ts                 # ADD blog sourceWeight to all 5 pillars
```

### 6.2 Pipeline Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    RECON ULTRA PIPELINE                           │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ INPUT: userId + pillarId                                 │     │
│  └───────────┬─────────────────────────────────────────────┘     │
│              ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ STAGE 0: Load User Profile                               │     │
│  │ • Query users table (V2 preferred, V1 fallback)          │     │
│  │ • Extract: niche, audience, frustration, desire, pillars │     │
│  │ • Load pillarConfig from PILLAR_CONFIGS                   │     │
│  └───────────┬─────────────────────────────────────────────┘     │
│              ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ STAGE 1: Generate Queries                                 │     │
│  │ • Check sf_recon_query_cache (profile_hash match)        │     │
│  │ • If cache miss: Gemini 2.5 Flash → 3-7 queries/pillar  │     │
│  │ • Queries aligned to pillar.queryAngles[]                │     │
│  └───────────┬─────────────────────────────────────────────┘     │
│              ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ STAGE 2: Multi-Source Fetch (parallel)                    │     │
│  │                                                           │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │     │
│  │  │  Google   │ │  Reddit  │ │ Twitter  │ │   Blog   │   │     │
│  │  │  News    │ │  Dynamic │ │ Dynamic  │ │ Scraper  │   │     │
│  │  │ (RSS)    │ │ (API)    │ │(API.io)  │ │(Playwrt) │   │     │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘   │     │
│  │       └──────┬──────┴──────┬─────┴──────┬─────┘         │     │
│  │              ▼ MERGE + DEDUP + EDITORIAL FILTER          │     │
│  └───────────┬─────────────────────────────────────────────┘     │
│              ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ STAGE 3: Profile-Aware Scoring                            │     │
│  │ • Recency score (time-based tiers)                       │     │
│  │ • Engagement score (source_score tiers)                  │     │
│  │ • Relevance score (TF-IDF vs profile keywords)           │     │
│  │ • Richness score (body, URL, author presence)            │     │
│  │ • Pillar alignment (Gemini micro-classify)               │     │
│  │ • Final = weighted sum × source multiplier               │     │
│  └───────────┬─────────────────────────────────────────────┘     │
│              ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐     │
│  │ STAGE 4: Enrich + Store                                   │     │
│  │ • Top 5 candidates: scrape full body (if not blog)       │     │
│  │ • Auto-tag pillar (highest alignment score)              │     │
│  │ • Assign smart TTL by source_type                        │     │
│  │ • Upsert to sf_intel_sources_v2                          │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### 6.3 Forge-Smart Integration Flow

```
┌─────────────────────────────────────────────────────────┐
│              FORGE-SMART (MODIFIED)                       │
│                                                          │
│  ┌────────────────────────────────────────────────┐     │
│  │ NEW Stage 0: Cache Lookup                       │     │
│  │ → Query sf_intel_sources_v2                     │     │
│  │ → WHERE user_id, pillar_tag, !used, !expired   │     │
│  │ → IF >= 3 items AND top.final_score >= 7.0     │     │
│  │   → CACHE HIT → Skip to Stage 3               │     │
│  │ → ELSE → CACHE MISS → Continue below           │     │
│  └────────────────┬───────────────────────────────┘     │
│                   ▼                                      │
│  Stage 1: generateSmartQueries()     (unchanged)        │
│  Stage 2: fetchSmartCandidates()     (unchanged)        │
│  Stage 2.5: enrichWinnerWithScrapedBody() (unchanged)   │
│  Stage 3: selectBestCandidate()      (add blog weight)  │
│  Stage 4: forgePersonalizedCarousel() (unchanged)       │
│                   │                                      │
│  NEW: Write-back scored candidates to                    │
│       sf_intel_sources_v2 for future cache               │
└─────────────────────────────────────────────────────────┘
```

---

## 7. Schema & Data Model

### 7.1 New Table: `sf_intel_sources_v2`

```sql
-- Migration: xxx_create_sf_intel_sources_v2.sql

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
```

### 7.2 New Table: `sf_user_blog_sources`

```sql
-- Migration: xxx_create_sf_user_blog_sources.sql

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
```

### 7.3 New Table: `sf_recon_query_cache`

```sql
-- Migration: xxx_create_sf_recon_query_cache.sql

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
```

### 7.4 Type System Updates

```typescript
// src/modules/recon-ultra/recon-ultra.types.ts

export type ReconSourceType = 'google_news' | 'google_trends' | 'reddit' | 'twitter' | 'blog';

export interface ReconUltraRequest {
  userId: string;
  pillarId: PillarId;
  sources?: ReconSourceType[];  // optional filter — default: all
}

export interface ReconUltraCandidate {
  source_type: ReconSourceType;
  title: string;
  summary: string | null;
  body_content: string | null;
  url: string | null;
  author: string | null;
  category: string | null;

  // Engagement
  source_score: number | null;
  source_comments: number | null;
  source_retweets: number | null;
  source_views: number | null;

  // Scoring (5 dimensions)
  recency_score: number;
  engagement_score: number;
  relevance_score: number;
  richness_score: number;
  pillar_alignment_score: number;
  final_score: number;

  // Metadata
  pillar_tag: PillarId;
  query_used: string;
  posted_at: string | null;
  expires_at: string;
}

export interface ReconUltraResult {
  userId: string;
  pillarId: PillarId;
  candidates: ReconUltraCandidate[];
  sources_used: ReconSourceType[];
  total_collected: number;
  total_after_filter: number;
  cache_queries_used: boolean;
  duration_ms: number;
}

export interface BlogSource {
  id: string;
  user_id: string;
  blog_url: string;
  blog_name: string | null;
  scrape_frequency: 'hourly' | 'daily' | 'weekly';
  is_active: boolean;
  last_scraped_at: string | null;
}

export interface BlogScrapedArticle {
  url: string;
  title: string;
  body_content: string;
  author: string | null;
  posted_at: string | null;
  word_count: number;
  key_quotes: string[];
}
```

```typescript
// Update: src/shared/types/pillar.types.ts

export type SourceType = 'google_news' | 'reddit' | 'twitter' | 'blog';  // ADD 'blog'
```

---

## 8. API Endpoints

### 8.1 Recon Ultra Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `POST` | `/api/recon-ultra/run` | Run full recon for user + pillar | Service/Admin |
| `POST` | `/api/recon-ultra/run/:source` | Run single source recon | Service/Admin |
| `GET` | `/api/recon-ultra/intel` | List user's cached intel (filterable) | User |
| `GET` | `/api/recon-ultra/intel/:pillarId` | List intel for specific pillar | User |

**POST `/api/recon-ultra/run`** — Request:
```json
{
  "userId": "uuid",
  "pillarId": "educate",
  "sources": ["google_news", "reddit", "blog"]  // optional, default: all
}
```

**GET `/api/recon-ultra/intel`** — Query params:
```
?pillar_tag=educate
&source_type=blog
&min_score=6.0
&used=false
&limit=20
&offset=0
```

### 8.2 Blog Source Endpoints

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `POST` | `/api/recon-ultra/blog-sources` | Add blog URL | User |
| `GET` | `/api/recon-ultra/blog-sources` | List user's blog sources | User |
| `DELETE` | `/api/recon-ultra/blog-sources/:id` | Remove blog source | User |
| `PATCH` | `/api/recon-ultra/blog-sources/:id` | Toggle active/inactive | User |
| `POST` | `/api/recon-ultra/blog-sources/suggest` | AI-suggest blogs for niche | User |
| `POST` | `/api/recon-ultra/blog-sources/:id/scrape` | Manual trigger scrape | User |

**POST `/api/recon-ultra/blog-sources`** — Request:
```json
{
  "blog_url": "https://blog.hubspot.com",
  "blog_name": "HubSpot Blog",
  "scrape_frequency": "daily"
}
```

**POST `/api/recon-ultra/blog-sources/suggest`** — Response:
```json
{
  "suggestions": [
    { "url": "https://blog.hubspot.com", "name": "HubSpot Blog", "reason": "Leading marketing insights" },
    { "url": "https://neilpatel.com/blog", "name": "Neil Patel", "reason": "SEO and content strategy" }
  ]
}
```

---

## 9. Scope

### IN SCOPE

- New `recon-ultra` module with full pipeline (Stages 0-4)
- Profile-aware query generation via Gemini
- Dynamic sources: Google News, Google Trends, Reddit, Twitter (adapted from existing)
- Blog scraper with Playwright stealth + Readability.js
- New database tables: `sf_intel_sources_v2`, `sf_user_blog_sources`, `sf_recon_query_cache`
- RLS policies for all new tables
- Forge-Smart Stage 0 cache integration
- Blog source CRUD API
- Blog suggestion via Gemini
- Smart TTL by source type
- Unified scoring with 5 dimensions + pillar weights
- Source multiplier update for `blog` across all 5 pillar configs

### OUT OF SCOPE

- Frontend UI for blog source management (separate story)
- Frontend UI for intel browsing/preview (separate story)
- Scheduled/cron recon execution (can be triggered manually or by existing scheduler)
- Migration/deprecation of old `recon` module (keep running in parallel)
- Google Trends Enriched (Puppeteer full-page) — too expensive, replaced by dynamic trends
- Proxy rotation for anti-bot (future enhancement)
- Multi-language query generation (English only for v1)
- User-configured subreddit preferences (auto-discovery only)

---

## 10. Dependencies & Risks

### Dependencies

| Dependency | Status | Impact |
|------------|--------|--------|
| `playwright-extra` + stealth plugin | Already in project (twitter.source.ts) | None — reuse |
| `@mozilla/readability` | NEW — needs install | npm dependency |
| `jsdom` | NEW — needed for Readability.js | npm dependency |
| `rss-parser` | Already in project | None — reuse |
| `snoowrap` | Already in project | None — reuse |
| `google-trends-api` | Already in project | None — reuse |
| TwitterAPI.io API key | Already configured | None — reuse |
| Gemini 2.5 Flash | Already configured (`src/config/gemini.ts`) | None — reuse |
| User V2 profile fields | Already deployed (migration 024) | None |
| Pillar System | Already deployed | Need to add `blog` to `SourceType` |

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Playwright memory leaks in production | Medium | High | Browser pool with max 2 instances, 30s timeout kill, memory monitoring |
| Blog anti-bot detection blocking scrapes | Medium | Medium | Stealth plugin, UA rotation, rate limiting. Graceful fallback: skip blog source |
| Gemini API costs scaling with users | Low | Medium | Query cache (24h), pillar classification cache (72h), max 5 calls/user/day |
| Google News RSS rate limiting | Low | Low | Already proven stable at current scale. Add exponential backoff |
| Reddit API rate limits with subreddit discovery | Medium | Medium | Cache discovered subreddits for 7 days. Fallback: use hardcoded popular subs per niche |
| Large sf_intel_sources_v2 table | Low | Medium | Smart TTL auto-cleanup, max 500 rows/user constraint via scheduled purge |
| Breaking `SourceType` union change | Low | Low | Additive change only (`'blog'` added). No existing code breaks |

---

## 11. Epic Breakdown

### Recommended Implementation Order

| # | Epic | Dependencies | Priority | Effort |
|---|------|-------------|----------|--------|
| 1 | **Recon Ultra Core** — Module scaffold, types, query builder, scoring engine, storage | None | P0 | Large |
| 2 | **Dynamic Sources** — Adapt news/trends/reddit/twitter from hardcoded to profile-driven | Epic 1 | P0 | Medium |
| 3 | **Blog Scraper** — Playwright stealth + Readability.js + blog source management | Epic 1 | P1 | Large |
| 4 | **Forge-Smart Integration** — Stage 0 cache, write-back, pillar SourceType update | Epics 1 + 2 | P1 | Medium |
| 5 | **Pillar Scoring Upgrade** — Gemini pillar classification, alignment score, updated weights | Epic 1 | P2 | Small |

### Wave Structure

**Wave 1 (Foundation):** Epic 1
- Module scaffold, types, database migrations, query builder, scoring engine

**Wave 2 (Parallel):** Epics 2 + 3
- Epic 2: Dynamic source adapters (can develop independently)
- Epic 3: Blog scraper (can develop independently)

**Wave 3 (Integration):** Epic 4
- Forge-Smart cache integration (requires Epics 1+2 complete)

**Wave 4 (Enhancement):** Epic 5
- Gemini pillar classification (nice-to-have, improves scoring quality)

---

## 12. Acceptance Criteria by Epic

### Epic 1: Recon Ultra Core

- [ ] AC1: `src/modules/recon-ultra/` module exists with all type definitions
- [ ] AC2: Migration creates `sf_intel_sources_v2` with all columns, indexes, and RLS
- [ ] AC3: Migration creates `sf_recon_query_cache` with all columns and indexes
- [ ] AC4: `recon-query-builder.ts` generates 3-7 queries per pillar using Gemini, consuming user V2 profile
- [ ] AC5: `recon-query-builder.ts` falls back to V1 profile when V2 unavailable
- [ ] AC6: Query cache hit skips Gemini call; cache invalidated on profile_hash change
- [ ] AC7: `profile-scorer.ts` computes TF-IDF relevance against profile keywords (not AI-regex)
- [ ] AC8: `recon-ultra.service.ts` orchestrates the 5-stage pipeline end-to-end
- [ ] AC9: `recon-ultra.controller.ts` exposes `POST /run` and `GET /intel` endpoints
- [ ] AC10: All candidates stored in `sf_intel_sources_v2` with correct TTL per source_type
- [ ] AC11: Deduplication by `(user_id, url)` works — upserts on score improvement

### Epic 2: Dynamic Sources

- [ ] AC1: `news-dynamic.source.ts` fetches Google News RSS using profile-derived queries (not hardcoded)
- [ ] AC2: `trends-dynamic.source.ts` uses profile keywords instead of `env.GOOGLE_TRENDS_KEYWORDS`
- [ ] AC3: `reddit-dynamic.source.ts` discovers subreddits based on user niche, caches for 7 days
- [ ] AC4: `twitter-dynamic.source.ts` uses profile queries instead of `env.TWITTER_SEARCH_QUERIES`
- [ ] AC5: All 4 sources run in parallel via `Promise.allSettled`
- [ ] AC6: One source failure does NOT block other sources
- [ ] AC7: Each source returns `ReconUltraCandidate[]` with all 5 scoring dimensions populated

### Epic 3: Blog Scraper

- [ ] AC1: Migration creates `sf_user_blog_sources` table with RLS
- [ ] AC2: Blog source CRUD endpoints work (add, list, remove, toggle)
- [ ] AC3: Blog URL validation rejects invalid URLs, social media domains, and private IPs
- [ ] AC4: Max 10 blog sources per user enforced
- [ ] AC5: `blog.source.ts` uses Playwright with stealth plugin for scraping
- [ ] AC6: Article extraction uses `@mozilla/readability` as primary strategy
- [ ] AC7: Fallback to CSS selectors when Readability fails
- [ ] AC8: Blog scraper respects rate limit: max 3 req/min per domain
- [ ] AC9: Browser instances capped at 2 concurrent, killed after 30s timeout
- [ ] AC10: Content quality filter rejects articles < 300 chars
- [ ] AC11: Blog suggestion endpoint returns 3-5 niche-relevant blogs via Gemini
- [ ] AC12: `posted_at` extracted from article metadata (og:published_time or schema.org)

### Epic 4: Forge-Smart Integration

- [ ] AC1: `SourceType` union updated to include `'blog'` in `pillar.types.ts`
- [ ] AC2: All 5 pillar configs have `blog` entry in `sourceWeights`
- [ ] AC3: Forge-Smart Stage 0 queries `sf_intel_sources_v2` before live fetch
- [ ] AC4: Cache hit (>= 3 items, top score >= 7.0) skips Stages 1-2
- [ ] AC5: Cache miss proceeds with current Stages 1-3 unchanged
- [ ] AC6: After live fetch, all scored candidates written back to `sf_intel_sources_v2`
- [ ] AC7: Selected winner marked `used = TRUE` with `used_in_post_id` and `used_at`
- [ ] AC8: Post metadata includes `generation_source: 'cache' | 'live'`
- [ ] AC9: Forge-Smart graceful fallback: if cache query fails, proceed with live fetch

### Epic 5: Pillar Scoring Upgrade

- [ ] AC1: `pillar-tagger.ts` classifies content against all 5 pillars via Gemini micro-prompt
- [ ] AC2: Classification cached per URL for 72h
- [ ] AC3: `pillar_alignment_score` populated in `sf_intel_sources_v2`
- [ ] AC4: Final score formula includes pillar alignment at 0.15 weight
- [ ] AC5: `pillar_tag` auto-assigned as pillar with highest alignment score
- [ ] AC6: Gemini calls capped at max 5/user/day for classification

---

## 13. Verification Plan

| # | Test | Validates |
|---|------|-----------|
| 1 | Create user with V2 profile (niche: "fitness coaching"), run recon for `educate` pillar → queries contain fitness/coaching terms, NOT AI terms | FR-QRY-01, F1/F2 fix |
| 2 | Run recon twice with same profile within 24h → second run uses cached queries (no Gemini call) | FR-QRY-02 |
| 3 | Change user's `niche` → next recon generates new queries (cache invalidated by profile_hash change) | FR-QRY-02 |
| 4 | Run Google News source with query "fitness meal prep" → returns fitness articles, not AI news | FR-SRC-01, F2 fix |
| 5 | Run Reddit source for niche "cooking" → discovers relevant subreddits (r/cooking, r/MealPrepSunday, etc.) | FR-SRC-03 |
| 6 | Add blog URL "https://blog.hubspot.com" → stored in sf_user_blog_sources. Add same URL again → rejected (unique constraint) | FR-BLOG-01 |
| 7 | Add blog URL "https://twitter.com/user" → rejected (social media domain). Add "http://localhost:8080" → rejected (private IP) | FR-BLOG-01, NFR-SEC-02 |
| 8 | Scrape blog article → returns title, body (> 300 chars), author, posted_at | FR-SRC-05 |
| 9 | Scrape blog that blocks bots → Playwright stealth bypasses basic protection | FR-SRC-05 |
| 10 | Blog scrape timeout > 30s → browser killed, returns empty gracefully | NFR-REL-02 |
| 11 | Score candidate with niche keywords in title → relevance_score > 6.0. Score candidate without keywords → relevance_score < 4.0 | FR-SCR-01 |
| 12 | Same candidate scored for EDUCATE vs PROVOKE pillar → different final_scores (weight differences) | FR-SCR-01 |
| 13 | Blog candidate scored for EDUCATE → final_score boosted by 1.8× multiplier | FR-SCR-01 |
| 14 | Run full recon → items stored in sf_intel_sources_v2 with correct TTL (twitter=24h, blog=7d) | FR-STR-02 |
| 15 | Two users run recon → each sees only their own intel (RLS enforced) | NFR-SEC-01 |
| 16 | Forge-Smart request with >= 3 cached items (top >= 7.0) → uses cache, skips live fetch | FR-INT-01 |
| 17 | Forge-Smart request with < 3 cached items → performs live fetch, writes back to cache | FR-INT-01, FR-INT-02 |
| 18 | Forge-Smart selects winner from cache → intel item marked `used = TRUE` with post ID | FR-INT-03 |
| 19 | One source fails during recon run → other sources complete successfully | NFR-REL-01 |
| 20 | All sources fail → Forge-Smart falls back to current live-fetch pipeline | NFR-REL-03 |

---

> **TRACEABILITY GUARANTEE:** Every functional requirement traces to a diagnosed flaw (F1-F7) from @analyst's investigation. Every acceptance criterion traces to a functional requirement. Every test validates at least one acceptance criterion.

---

*— Morgan, planejando o futuro* 📊
