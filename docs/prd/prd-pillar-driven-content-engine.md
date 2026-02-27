# PILLAR-DRIVEN CONTENT ENGINE — PRD

> **Feature Codename:** PDCE — Pillar-Driven Content Engine
> **Type:** Backend overhaul + frontend refactor (brownfield)
> **Status:** Draft — Ready for Review
> **Author:** @pm (Morgan) · Research by @analyst (Atlas)
> **Date:** 2026-02-26
> **Scope:** Forge Smart, Forge Personalized, /create page, Theme System, Content Schema
> **Document optimized for execution via Claude Code.**

---

## Table of Contents

1. [Background & Diagnosis](#1-background--diagnosis)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Target Users](#3-target-users)
4. [Content Pillar Framework](#4-content-pillar-framework)
5. [Functional Requirements](#5-functional-requirements)
6. [Forge Smart Evolution — Pillar-Driven Discovery](#6-forge-smart-evolution--pillar-driven-discovery)
7. [Forge Personalized Evolution — Pillar-Driven Transformation](#7-forge-personalized-evolution--pillar-driven-transformation)
8. [Theme System Refactor — Pure Design Layer](#8-theme-system-refactor--pure-design-layer)
9. [Universal Slide Roles & Content Schema](#9-universal-slide-roles--content-schema)
10. [/create Page Refactor](#10-create-page-refactor)
11. [Hook Archetype System](#11-hook-archetype-system)
12. [Awareness-Level Adaptation](#12-awareness-level-adaptation)
13. [Smart Pillar Suggestion](#13-smart-pillar-suggestion)
14. [Product Seeding Gradient](#14-product-seeding-gradient)
15. [Schema & Data Model](#15-schema--data-model)
16. [API Contracts](#16-api-contracts)
17. [Scope](#17-scope)
18. [Dependencies & Risks](#18-dependencies--risks)
19. [Epic Breakdown](#19-epic-breakdown)
20. [Verification Plan](#20-verification-plan)

---

## 1. Background & Diagnosis

### 1.1 The ShadowFeed Engine as Benchmark

The forge-shadowfeed module (powering the @shadowfeed.ai Instagram account) is highly efficient because every post is pre-determined by **3 strategic decisions before the LLM is invoked**:

1. **Content Pillar** — What is the post's strategic purpose? (educate, provoke, prove, etc.)
2. **Hook Archetype** — What psychological pattern opens the carousel? (controversy, number, promise, etc.)
3. **7-Zone Structure** — What narrative arc does the carousel follow? (hook → context → content → tension → soft-cta → cta)

The theme (visual design) is completely decoupled from content strategy. This separation is the core of its efficiency.

### 1.2 Current State — Forge Personalized & /create

The user-facing content creation system (`forge-personalized` + `/create` page) has critical architectural gaps:

| Aspect | Forge ShadowFeed (Admin) | Forge Personalized (/create) | Gap |
|---|---|---|---|
| **Content Strategy** | 5 pillars drive every decision | No pillars — theme drives everything | No strategic intent behind posts |
| **Theme Role** | Pure aesthetics (colors, fonts) | Mixed (aesthetics + content rules + slide count + density) | Themes do too much |
| **Search Agent** | Discovery pipeline per pillar (4 sources, scoring, summarization) | None — user manually finds and pastes URL | No intelligent content sourcing |
| **Hook System** | 6 archetypes with weighted selection | None — LLM generates random hooks | Weak scroll-stop performance |
| **Setup V2 Usage** | N/A (brand account) | Collects 20+ fields, uses ~30% | Massive underutilization |
| **Product Integration** | Double-door seeding (whisper/mention/spotlight) | Binary ON/OFF toggle | No graduated product strategy |
| **Awareness Calibration** | N/A | Collects `audience_awareness` but ignores it | Same content regardless of audience sophistication |

### 1.3 Forge Smart — Current State

The `forge-smart` module has a content discovery agent but it operates **generically**:

- Generates 5 queries with fixed angles (trending, pain, solution, story, data) regardless of content intent
- Scoring is uniform: `recency(40%) + engagement(30%) + relevance(20%) + richness(10%)` for all content types
- Sources (Google News, Reddit, Twitter) are weighted equally regardless of what type of content is needed
- Delegates to `forge-personalized` for carousel generation — inheriting all its limitations

### 1.4 Why This Matters

Without pillar-driven content, the user-facing system produces **generically competent but strategically empty** carousels. A nutritionist creating a post about "intermittent fasting" gets the same treatment whether the goal is to educate, provoke, prove results, or sell a course. The content lacks intent.

The ShadowFeed admin system proves the pillar model works. This PRD extends that model to the user-facing system, adapted for personalization via Setup V2 data.

---

## 2. Goals & Success Metrics

### 2.1 Goals

| # | Goal | Rationale |
|---|---|---|
| G1 | Every user-generated post is driven by a content pillar that determines structure, tone, and intent | Eliminates generic content; every post has strategic purpose |
| G2 | Forge Smart searches intelligently based on the selected pillar — different queries, sources, and scoring per pillar | Replaces generic discovery with pillar-specialized intelligence |
| G3 | Forge Personalized transforms user-provided content through the lens of the selected pillar | Same source URL produces fundamentally different carousels per pillar |
| G4 | Themes become pure visual design — zero influence on content logic, slide count, or density | Decouples design from strategy; new themes are CSS-only additions |
| G5 | Setup V2 data is deeply integrated into every prompt block — persona, audience, tone, offers | >90% of collected fields actively influence content generation |
| G6 | /create page guides users through pillar selection with smart suggestions based on usage history | Users understand and intentionally choose content strategy |
| G7 | Hook archetypes and awareness-level adaptation produce varied, targeted content | Content varies by 30 combinations (5 pillars × 6 archetypes) calibrated by awareness |

### 2.2 Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Pillar adoption rate | >80% of /create posts use explicit pillar selection (not default) | Track `pillar_id` field on `sf_posts` |
| Setup V2 field utilization | >90% of non-null setup fields appear in generated prompts | Audit prompt builder field mapping |
| Smart discovery relevance | >60% of Smart-generated posts use discovery source (vs. fallback) | Track `smart_query_used` IS NOT NULL on smart posts |
| Content variety score | All 5 pillars used within any 14-day window per active user | SQL query on user's `sf_posts` |
| Theme decoupling | Zero content-logic fields remain in PostTheme interface | Code audit of PostTheme type |
| Hook archetype coverage | All 6 archetypes used within 30-day window per user | Track `hook_archetype` column |
| User satisfaction | >4.0/5.0 on post quality rating (future feedback mechanism) | In-app rating widget |

---

## 3. Target Users

| User Type | Description | Primary Benefit |
|---|---|---|
| **ShadowFeed User (Manual Mode)** | Creates posts via `/create` by providing a URL or topic | Pillar transforms their source into strategically-structured content |
| **ShadowFeed User (Auto Mode)** | Creates posts via `/create` using Smart auto-discovery | Agent finds the right content for the right pillar automatically |
| **ShadowFeed Admin** | Manages ShadowFeed brand account content | No change — existing pillar system in forge-shadowfeed is unaffected |

---

## 4. Content Pillar Framework

### 4.1 Five Universal Content Functions

Every business, regardless of niche, needs content that serves these 5 strategic functions:

| Pillar | ID | Proportion | Strategic Function | Derived from Setup V2 |
|---|---|---|---|---|
| **Educate** | `educate` | 30% | Demonstrate expertise, teach valuable skills | `niche`, `expertise_statement`, `content_pillars[]` |
| **Provoke** | `provoke` | 20% | Challenge beliefs, generate debate, create urgency | `audience_frustration`, `audience_objection`, `brand_personality` |
| **Prove** | `prove` | 20% | Show results, document transformations, build credibility | `transformation_before/after`, `offers[]` |
| **Connect** | `connect` | 20% | Create identification, humanize the brand, build community | `target_audience`, `audience_desire`, `voice_tone` |
| **Convert** | `convert` | 10% | Present offer as natural solution, drive action | `offers[]`, `primary_goal`, `audience_awareness` |

### 4.2 Pillar Configuration Spec

Each pillar defines a complete set of content rules:

```typescript
interface PillarConfig {
  id: PillarId;                           // 'educate' | 'provoke' | 'prove' | 'connect' | 'convert'
  name: string;                           // Display name
  description: string;                    // Short description for UI
  icon: string;                           // Lucide icon name
  proportion: number;                     // 0.30 | 0.20 | 0.20 | 0.20 | 0.10

  // Content Structure
  slideRange: { min: number; max: number };
  requiredRoles: SlideRole[];             // Mandatory slide roles
  optionalRoles: SlideRole[];             // May include if slide count allows

  // Prompt Rules
  objective: string;                      // What the LLM must achieve
  requiredElements: string[];             // Must appear in output
  forbiddenElements: string[];            // Must NOT appear in output
  toneOverride: string;                   // Pillar-specific tone instruction
  ctaStyle: string;                       // CTA pattern for this pillar
  captionStyle: 'one-liner' | 'micro-story' | 'challenge';

  // Discovery (Forge Smart)
  queryAngles: string[];                  // 5 query generation angles
  sourceWeights: Record<SourceType, number>; // Source priority multipliers
  scoringWeights: ScoringWeights;         // Custom scoring formula

  // Hook Affinity
  hookAffinityBoost: Record<HookArchetypeId, number>; // Multiplier per archetype

  // Product Seeding
  productSeedIntensity: 'none' | 'whisper' | 'mention' | 'full';
}
```

### 4.3 Pillar Detail — EDUCATE (30%)

```yaml
id: educate
name: "Educate"
description: "Teach something valuable your audience can act on"
icon: "GraduationCap"
proportion: 0.30

slideRange: { min: 8, max: 12 }
requiredRoles: [hook, context, content, cta]
optionalRoles: [tension, soft-cta]

objective: "Teach something valuable and actionable from the user's area of expertise"
requiredElements:
  - "Framework, list, or step-by-step from the source"
  - "Concrete data points from the source (never invented)"
  - "Actionable takeaway the reader can apply immediately"
forbiddenElements:
  - "Opinion without supporting data"
  - "Gratuitous provocation"
  - "Direct selling or product pitch"
toneOverride: "Teacher-mode: calm authority, trusted guide. Explain complex things simply."
ctaStyle: "Save this / Share with someone who needs it / Apply this today"
captionStyle: micro-story

queryAngles: [tutorial, framework, data, trend, how-to]
sourceWeights: { google_news: 1.5, reddit: 1.0, twitter: 0.8 }
scoringWeights: { recency: 0.20, engagement: 0.15, relevance: 0.25, richness: 0.40 }

hookAffinityBoost:
  specific-number: 1.5
  curiosity-mystery: 1.5
  direct-controversy: 0.8
  polarization: 0.5
  transformative-promise: 1.0
  social-proof: 0.8

productSeedIntensity: whisper
```

### 4.4 Pillar Detail — PROVOKE (20%)

```yaml
id: provoke
name: "Provoke"
description: "Challenge a belief your audience holds — with proof"
icon: "Zap"
proportion: 0.20

slideRange: { min: 4, max: 7 }
requiredRoles: [hook, context, content, cta]
optionalRoles: [tension]

objective: "Break a limiting belief using surprising data or counter-narrative"
requiredElements:
  - "Surprising data point or counter-intuitive fact in the hook"
  - "Clear counter-narrative that challenges conventional wisdom"
  - "Direct confrontation — no hedging, no both-sides"
forbiddenElements:
  - "Hedging language (maybe, perhaps, in my opinion)"
  - "Balanced/conciliatory tone"
  - "Long explanations — short, punchy slides"
toneOverride: "Confrontational: no half-measures, no apologies. Say what others won't."
ctaStyle: "Agree? Comment / Tag someone who needs to hear this"
captionStyle: one-liner

queryAngles: [myth, controversy, failure, unpopular-opinion, pain-validation]
sourceWeights: { google_news: 0.8, reddit: 1.2, twitter: 1.5 }
scoringWeights: { recency: 0.40, engagement: 0.30, relevance: 0.20, richness: 0.10 }

hookAffinityBoost:
  direct-controversy: 1.5
  polarization: 1.5
  curiosity-mystery: 1.0
  specific-number: 0.8
  transformative-promise: 0.5
  social-proof: 0.5

productSeedIntensity: none
```

### 4.5 Pillar Detail — PROVE (20%)

```yaml
id: prove
name: "Prove"
description: "Show tangible results with evidence and before/after"
icon: "TrendingUp"
proportion: 0.20

slideRange: { min: 6, max: 8 }
requiredRoles: [hook, context, content, tension, soft-cta, cta]
optionalRoles: []

objective: "Demonstrate tangible results with documented evidence"
requiredElements:
  - "Concrete number or metric"
  - "Before/after comparison"
  - "Documented process (not just result)"
forbiddenElements:
  - "Vague promises without data"
  - "Results without context"
  - "Exaggeration or unverifiable claims"
toneOverride: "Factual: numbers speak. Let the proof sell itself."
ctaStyle: "Want the same? / Link in bio / DM me"
captionStyle: micro-story

queryAngles: [case-study, before-after, results, metrics, testimonial]
sourceWeights: { google_news: 1.0, reddit: 1.5, twitter: 0.8 }
scoringWeights: { recency: 0.15, engagement: 0.20, relevance: 0.35, richness: 0.30 }

hookAffinityBoost:
  transformative-promise: 1.5
  social-proof: 1.5
  specific-number: 1.0
  direct-controversy: 0.8
  curiosity-mystery: 0.8
  polarization: 0.5

productSeedIntensity: mention
```

### 4.6 Pillar Detail — CONNECT (20%)

```yaml
id: connect
name: "Connect"
description: "Create emotional identification with your audience"
icon: "Heart"
proportion: 0.20

slideRange: { min: 5, max: 8 }
requiredRoles: [hook, context, content, soft-cta, cta]
optionalRoles: [tension]

objective: "Create emotional identification — speak WITH the audience, not AT them"
requiredElements:
  - "Genuine vulnerability or relatable moment"
  - "Audience's own language and expressions"
  - "Moment of identification (reader thinks: 'that's me')"
forbiddenElements:
  - "Professorial/lecturing tone"
  - "Cold data without emotional context"
  - "Any selling or product promotion"
toneOverride: "Empathetic: speak as a peer who's been there. Warm, honest, real."
ctaStyle: "Relate? Share / Comment your experience / Tag someone"
captionStyle: micro-story

queryAngles: [struggle, behind-scenes, community-question, relatable-moment, audience-voice]
sourceWeights: { google_news: 0.5, reddit: 1.5, twitter: 1.3 }
scoringWeights: { recency: 0.25, engagement: 0.35, relevance: 0.25, richness: 0.15 }

hookAffinityBoost:
  curiosity-mystery: 1.5
  transformative-promise: 1.5
  social-proof: 1.0
  direct-controversy: 0.5
  specific-number: 0.8
  polarization: 0.5

productSeedIntensity: none
```

### 4.7 Pillar Detail — CONVERT (10%)

```yaml
id: convert
name: "Convert"
description: "Present your offer as the natural solution"
icon: "Target"
proportion: 0.10

slideRange: { min: 8, max: 10 }
requiredRoles: [hook, context, content, tension, soft-cta, cta]
optionalRoles: []

objective: "Present the user's offer as the natural solution to a documented problem"
requiredElements:
  - "Problem → solution narrative arc"
  - "Social proof or credibility signal"
  - "Clear CTA matching offers[].purchase_method"
forbiddenElements:
  - "Hard selling without context"
  - "Impossible promises"
  - "Desperation or urgency manipulation"
toneOverride: "Persuasive: confident, direct, no desperation. The offer speaks for itself."
ctaStyle: "Dynamic — derived from offers[].purchase_method + cta_keyword"
captionStyle: challenge

queryAngles: [comparison, cost-analysis, competitor-weakness, roi-data, objection-breaker]
sourceWeights: { google_news: 1.3, reddit: 0.8, twitter: 1.2 }
scoringWeights: { recency: 0.30, engagement: 0.20, relevance: 0.30, richness: 0.20 }

hookAffinityBoost:
  direct-controversy: 1.5
  specific-number: 1.5
  social-proof: 1.0
  transformative-promise: 1.0
  curiosity-mystery: 0.8
  polarization: 0.8

productSeedIntensity: full
```

---

## 5. Functional Requirements

### 5.1 Core Pillar System

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | A new `PillarId` type is defined: `'educate' \| 'provoke' \| 'prove' \| 'connect' \| 'convert'` | P0 |
| FR-02 | A `PillarConfig` object is defined for each pillar with all fields specified in §4.2 | P0 |
| FR-03 | Both `ForgeSmartRequest` and `ForgePersonalizedRequest` accept an optional `pillarId` field | P0 |
| FR-04 | When `pillarId` is provided, the pillar's config overrides default content rules | P0 |
| FR-05 | When `pillarId` is NOT provided, the system defaults to `educate` pillar behavior | P0 |

### 5.2 Forge Smart — Pillar-Driven Discovery

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-10 | Query generation uses pillar-specific `queryAngles` instead of the fixed 5 angles | P0 |
| FR-11 | Query system prompt is dynamically constructed per pillar, incorporating user Setup V2 fields | P0 |
| FR-12 | Content scoring applies pillar-specific `scoringWeights` instead of the fixed formula | P0 |
| FR-13 | Source scoring applies pillar-specific `sourceWeights` as multipliers on `final_score` | P0 |
| FR-14 | The top 3 candidates are returned to the frontend for user selection (not just the #1 winner) | P1 |
| FR-15 | A "Custom URL" option remains available alongside the 3 curated sources | P1 |
| FR-16 | If the user selects a curated source, Forge Smart enriches it (scrape body) then delegates to Forge Personalized | P0 |

### 5.3 Forge Personalized — Pillar-Driven Transformation

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-20 | The prompt builder includes a new "PILLAR RULES" block with the pillar's `objective`, `requiredElements`, `forbiddenElements`, `toneOverride`, `ctaStyle`, and `captionStyle` | P0 |
| FR-21 | The `slideRange` is determined by the pillar config, NOT by the theme | P0 |
| FR-22 | The dynamic persona block (Block 1) is generated from `brand_personality` + `voice_tone` + `expertise_statement` + `niche` | P0 |
| FR-23 | The hook archetype block (Block 5) is included with pillar-specific archetype selection | P1 |
| FR-24 | Setup V2 fields are mapped to prompt blocks per §7.2 field mapping table | P0 |
| FR-25 | The LLM output JSON must include `pillar_id` field for tracking | P0 |

### 5.4 Theme System Refactor

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-30 | `PostTheme` interface is reduced to visual-only fields: `colorPalette`, `fonts`, `backgroundStrategy`, `layoutMap`, `borderRadius`, `decorativeElements` | P0 |
| FR-31 | The following fields are REMOVED from `PostTheme`: `slideCount`, `contentDensity`, `emojiUsage`, `systemPromptKey`, `toneInstructions` | P0 |
| FR-32 | System prompts that were theme-specific are migrated to pillar configs | P0 |
| FR-33 | Adding a new theme requires ONLY visual configuration — no content logic | P0 |

### 5.5 /create Page Refactor

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-40 | The /create flow adds a "Content Pillar" selection step between Source and Theme | P0 |
| FR-41 | Each pillar is displayed as a selectable card with: icon, name, description, slide range | P0 |
| FR-42 | The system suggests a pillar based on user's recent post history (§13) | P1 |
| FR-43 | Theme selection step shows ONLY visual properties (color preview, font sample) — no content descriptions | P0 |
| FR-44 | For Auto mode (Forge Smart), after pillar selection the system shows a discovery progress indicator followed by 3 curated source options | P1 |
| FR-45 | For Manual mode, the URL/topic input remains as-is — pillar is applied during generation | P0 |
| FR-46 | The /create page follows existing design system: dark theme (#0a0a0a bg, #8a00c4 accent, rounded-[3px], border-white/10) | P0 |

### 5.6 Universal Slide Roles

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-50 | A single `SlideRole` enum is used across ALL generation methods (personalized, smart, shadowfeed): `hook \| context \| content \| tension \| soft-cta \| cta` | P0 |
| FR-51 | The content schema validation enforces the universal roles | P0 |
| FR-52 | Theme layout mapping uses these universal roles to determine visual treatment | P0 |

### 5.7 Data Tracking

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-60 | `sf_posts` table gains a `pillar_id` column (nullable, text) | P0 |
| FR-61 | `sf_posts` table gains a `hook_archetype` column (nullable, text) | P1 |
| FR-62 | All new posts created via /create populate `pillar_id` | P0 |

---

## 6. Forge Smart Evolution — Pillar-Driven Discovery

### 6.1 Query Generation Per Pillar

The `smart-query-generator.ts` system prompt becomes dynamic. Instead of the fixed 5 angles, each pillar provides its own `queryAngles`:

**EDUCATE queries** prioritize depth and actionability:
```
angles: [tutorial, framework, data, trend, how-to]
example: "copywriting frameworks instagram carousels 2026"
```

**PROVOKE queries** prioritize controversy and emotional triggers:
```
angles: [myth, controversy, failure, unpopular-opinion, pain-validation]
example: "intermittent fasting criticism research evidence"
```

**PROVE queries** prioritize real results and metrics:
```
angles: [case-study, before-after, results, metrics, testimonial]
example: "small business instagram growth results case study"
```

**CONNECT queries** prioritize community voice and shared experiences:
```
angles: [struggle, behind-scenes, community-question, relatable-moment, audience-voice]
example: "nutritionist burnout content creation struggle"
```

**CONVERT queries** prioritize market data and competitive angles:
```
angles: [comparison, cost-analysis, competitor-weakness, roi-data, objection-breaker]
example: "nutrition coaching pricing market comparison 2026"
```

### 6.2 Source Weight Multipliers

After calculating `final_score`, multiply by `sourceWeights[candidate.source_type]`:

```typescript
const adjustedScore = candidate.final_score * pillarConfig.sourceWeights[candidate.source_type];
```

This causes Twitter results to rank higher for PROVOKE (1.5x), Reddit to rank higher for CONNECT (1.5x), etc.

### 6.3 Scoring Formula Override

Replace the fixed `(0.40, 0.30, 0.20, 0.10)` weights with `pillarConfig.scoringWeights`:

```typescript
const { recency, engagement, relevance, richness } = pillarConfig.scoringWeights;
const score = (recencyScore * recency) + (engagementScore * engagement)
            + (relevanceScore * relevance) + (richnessScore * richness);
```

### 6.4 Top-3 Candidate Response (P1)

Instead of selecting only the #1 winner, the Smart endpoint returns the top 3 scored candidates for user selection on the frontend. The enrichment (body scraping) happens AFTER the user selects one.

```typescript
interface SmartDiscoveryResponse {
  candidates: SmartCandidateScored[]; // Top 3
  pillarId: PillarId;
  queriesUsed: string[];
}
```

---

## 7. Forge Personalized Evolution — Pillar-Driven Transformation

### 7.1 New Prompt Architecture (10-Block)

The prompt builder evolves from 9 blocks to 10, with a dedicated PILLAR RULES block:

| Block | Source | Content |
|---|---|---|
| 1. PERSONA | Dynamic from Setup V2 | Generated from `brand_personality` + `voice_tone` + `expertise_statement` + `niche` |
| 2. **PILLAR RULES** (NEW) | PillarConfig | `objective`, `requiredElements`, `forbiddenElements`, `toneOverride`, `ctaStyle`, `captionStyle`, `slideRange` |
| 3. AUDIENCE CONTEXT | Setup V2 | `target_audience`, `audience_frustration`, `audience_desire`, `audience_objection`, `audience_awareness` |
| 4. COPY PHASES | Universal | 3-phase structure (interruption → development → conversion), intensity calibrated by pillar |
| 5. SOURCE DOCUMENT | URL scrape or Smart candidate | Title, summary, body content, data points |
| 6. HOOK ARCHETYPE | Selected per pillar affinity | Archetype structure, example, visual signature chance |
| 7. PRODUCT SEED | PillarConfig + offers[] | Graduated seeding based on `productSeedIntensity` |
| 8. ANTI-PATTERNS | Setup V2 + pillar | `avoid_topics` + pillar-specific forbidden elements |
| 9. AWARENESS CALIBRATION (NEW) | Setup V2 | `audience_awareness` → adjusts hook strategy, content depth, CTA directness |
| 10. OUTPUT FORMAT | Universal | JSON schema with universal slide roles |

### 7.2 Setup V2 Field Mapping

Every Setup V2 field maps to specific prompt blocks:

| Setup V2 Field | Prompt Block | How It's Used |
|---|---|---|
| `niche` | 1 (Persona), 2 (Pillar) | Defines content universe, filters query scope |
| `expertise_statement` | 1 (Persona) | Positions the angle of analysis |
| `transformation_before` | 3 (Audience), 7 (Product) | Before state for PROVE pillar narratives |
| `transformation_after` | 3 (Audience), 7 (Product) | After state for PROVE pillar narratives |
| `target_audience` | 3 (Audience) | Defines who the content speaks to |
| `audience_frustration` | 3 (Audience), 2 (Pillar/PROVOKE queries) | Primary confrontation point for PROVOKE |
| `audience_desire` | 3 (Audience) | Aspiration for CONNECT pillar |
| `audience_objection` | 3 (Audience), 2 (Pillar/PROVOKE) | Objections to destroy in PROVOKE/CONVERT |
| `audience_awareness` | 9 (Awareness) | Calibrates hook, depth, and CTA per §12 |
| `content_pillars[]` | 2 (Pillar) | Filters relevant topics within niche |
| `primary_goal` | 2 (Pillar/CONVERT) | Calibrates conversion aggressiveness |
| `content_depth` | 2 (Pillar) | Controls slide density (shallow=min, dense=max) |
| `posting_frequency` | 13 (Suggestion) | Used for smart pillar suggestion timing |
| `voice_tone` | 1 (Persona) | Core voice characteristic |
| `brand_personality[]` | 1 (Persona), 8 (Anti-patterns) | Personality traits influence tone intensity |
| `avoid_topics` | 8 (Anti-patterns) | Hard filter on forbidden content |
| `offers[]` | 7 (Product) | Full offer data for CONVERT, seed data for others |

### 7.3 Dynamic Persona Generation (Block 1)

Instead of a static system prompt, the persona is assembled from Setup V2:

```
Input: {
  brand_personality: ["Bold", "Direct", "Technical"],
  voice_tone: "provocative",
  expertise_statement: "I transform local businesses into digital brands",
  niche: "Digital Marketing"
}

Generated Block 1:
"You are a Digital Marketing expert who transforms local businesses into digital brands.
Your voice is bold, direct, and technical. You don't ramble, you don't use empty jargon,
and every sentence has a purpose. You speak with the authority of someone who has done it,
not someone who just has opinions.

Voice rules:
- Provocative tone: challenge beliefs, use data to destroy myths
- Bold personality: may be uncomfortable, as long as it's backed by facts
- Direct personality: zero filler, get to the point
- Technical personality: use frameworks, numbers, processes"
```

---

## 8. Theme System Refactor — Pure Design Layer

### 8.1 New PostTheme Interface

```typescript
interface PostTheme {
  id: string;                           // 'magazine' | 'twitter' | 'authority' | etc.
  name: string;                         // Display name
  description: string;                  // Visual description only
  preview: string;                      // Preview image path or CSS class

  // VISUAL ONLY
  colorPalette: {
    primary: string;                    // Main background
    secondary: string;                  // Alternate background
    accent: string;                     // Highlight color
    text: string;                       // Primary text
    textSecondary: string;              // Secondary text
  };
  backgroundStrategy: 'alternate' | 'uniform' | 'gradient';
  fonts: {
    heading: string;
    body: string;
    accent: string;
  };
  borderRadius: string;
  decorativeElements: string[];         // Visual flourishes

  // LAYOUT MAPPING (role → visual layout)
  layoutMap: Record<SlideRole, LayoutType>;

  // ACCESS
  exclusive?: boolean;                  // Internal-only themes
}
```

### 8.2 Fields REMOVED from PostTheme

The following are no longer theme concerns — they move to `PillarConfig`:

| Removed Field | Migrated To |
|---|---|
| `slideCount: { min, max }` | `PillarConfig.slideRange` |
| `contentDensity` | `PillarConfig` (derived from `content_depth` setup field) |
| `emojiUsage` | `PillarConfig` (derived from `brand_personality`) |
| `systemPromptKey` | `PillarConfig.objective` + pillar prompt rules |
| `toneInstructions` | `PillarConfig.toneOverride` + dynamic persona |
| `style` | Absorbed into `layoutMap` |

---

## 9. Universal Slide Roles & Content Schema

### 9.1 Universal SlideRole Enum

```typescript
type SlideRole = 'hook' | 'context' | 'content' | 'tension' | 'soft-cta' | 'cta';
```

This replaces any theme-specific role enums (`EditorialRoleEnum`, `AuthorityRoleEnum`).

### 9.2 7-Zone Carousel Anatomy (Universal)

| Zone | Role | Position | Purpose | Required |
|---|---|---|---|---|
| 1 | `hook` | Slide 1 | Scroll interruption | Always |
| 2 | `context` | Slides 2-3 | Problem/context setup | Min 1 |
| 3 | `content` | Slides 4 to N-3 | Body content | Min 2 |
| 4 | `tension` | Antepenultimate | Revelation/twist | Per pillar |
| 5 | `soft-cta` | Penultimate | Smooth transition | Per pillar |
| 6 | `cta` | Last slide | Call to action | Always |

### 9.3 Content Schema (unchanged structure, unified roles)

The `ContentSlide` schema remains the same but the `role` field uses the universal enum. The Zod validation schema is updated to accept only universal roles.

---

## 10. /create Page Refactor

### 10.1 New User Flow

**Manual Mode (5 steps):**
```
Step 1: Content Source ─── URL input or manual title/summary
           │
Step 2: Content Pillar ─── EDUCATE | PROVOKE | PROVE | CONNECT | CONVERT
           │                (with smart suggestion badge)
Step 3: Visual Theme ───── Magazine | Twitter | [future themes]
           │                (pure visual preview — no content descriptions)
Step 4: Model Selection ── Marketing Friend (5tk) | Expert Copywriter (10tk)
           │
Step 5: Finalization ───── Product mode toggle + cost summary + GENERATE
```

**Auto Mode (5 steps, Forge Smart):**
```
Step 1: Content Pillar ─── EDUCATE | PROVOKE | PROVE | CONNECT | CONVERT
           │                (with smart suggestion badge)
Step 2: Source Discovery ── Agent searches → presents 3 curated options + "Custom URL"
           │                (loading state: "Searching {niche} content for {pillar}...")
Step 3: Visual Theme ───── Magazine | Twitter | [future themes]
           │
Step 4: Model Selection ── Marketing Friend (5tk) | Expert Copywriter (10tk)
           │
Step 5: Finalization ───── Product mode toggle + cost summary + GENERATE
```

### 10.2 Pillar Selection UI

Each pillar displays as a card:

```
┌─────────────────────────────────────────┐
│  🎓  EDUCATE                    ★ Suggested │
│  Teach something valuable your          │
│  audience can act on                    │
│  ─────────────────────────────────────  │
│  📊 8-12 slides  │  🎯 Save/Share CTA  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  ⚡  PROVOKE                            │
│  Challenge a belief your audience       │
│  holds — with proof                     │
│  ─────────────────────────────────────  │
│  📊 4-7 slides   │  🎯 Comment/Tag CTA │
└─────────────────────────────────────────┘

[... PROVE, CONNECT, CONVERT cards ...]
```

### 10.3 Smart Discovery Results UI (Auto Mode, P1)

After pillar selection in Auto mode, the agent searches and presents:

```
┌─────────────────────────────────────────┐
│  Searching Digital Marketing content    │
│  for EDUCATE pillar...                  │
│  ████████████░░░░ 75%                   │
└─────────────────────────────────────────┘

         ↓ (after 3-5 seconds)

┌─────────────────────────────────────────┐
│  📰  "7 Copywriting Trends Changing     │
│       the Game in 2026"                 │
│       Score: 8.7 | Google News | 2h ago │
├─────────────────────────────────────────┤
│  📊  "Study: Carousels with Data Get    │
│       3.2x More Saves"                  │
│       Score: 8.1 | Twitter | 5h ago     │
├─────────────────────────────────────────┤
│  💡  "The AIDA Framework Applied to     │
│       Instagram: Complete Guide"         │
│       Score: 7.8 | Blog | 12h ago       │
├─────────────────────────────────────────┤
│  🔗  Paste a custom URL instead         │
└─────────────────────────────────────────┘
```

---

## 11. Hook Archetype System

### 11.1 Six Universal Archetypes

| ID | Name | Template | Best Pillar Affinity |
|---|---|---|---|
| `direct-controversy` | Direct Controversy | "{counter-intuitive fact} that {group} doesn't want you to know" | PROVOKE, CONVERT |
| `specific-number` | Specific Number | "{X} things that {negative consequence}" | EDUCATE, CONVERT |
| `transformative-promise` | Transformative Promise | "How {person} achieved {impossible result} in {short time}" | PROVE, CONNECT |
| `polarization` | Polarization | "{statement that divides opinions}" | PROVOKE |
| `curiosity-mystery` | Curiosity Mystery | "The real reason why {X} doesn't work" | EDUCATE, CONNECT |
| `social-proof` | Social Proof | "{concrete result} — and how to replicate it" | PROVE |

### 11.2 Personalized Hook Variables

Unlike ShadowFeed (fixed examples), the personalized system fills hook templates from Setup V2:

```typescript
hookVariables = {
  'direct-controversy': {
    counterIntuitiveFact: derived from niche myths,
    group: target_audience,
  },
  'specific-number': {
    concept: derived from content_pillars[],
    consequence: derived from audience_frustration,
  },
  'transformative-promise': {
    person: target_audience,
    result: transformation_after,
  },
  // ... etc
}
```

### 11.3 Selection Algorithm

1. Start with equal weights per archetype
2. Multiply by `pillarConfig.hookAffinityBoost[archetypeId]`
3. Exclude archetypes used in user's last 2 posts (anti-repeat)
4. Weighted random selection from remaining

---

## 12. Awareness-Level Adaptation

The `audience_awareness` field (Eugene Schwartz scale) calibrates the ENTIRE content output:

| Awareness Level | Hook Strategy | Content Depth | CTA Directness |
|---|---|---|---|
| `unaware` | Provocation/Curiosity (problem they don't know they have) | Heavy context, educate first | Soft (content → awareness) |
| `problem_aware` | Validate pain + new perspective | Diagnosis + framework | Medium (solve → interest) |
| `solution_aware` | Differentiation + proof | Comparative + results | Medium-direct (why this solution) |
| `brand_aware` | Specific results + case | Case study + social proof | Direct (offer details) |
| `most_aware` | Direct offer + urgency | Benefits + pricing | Maximum (buy now) |

### 12.1 Same Pillar, Different Output by Awareness

**EDUCATE + `unaware`:**
"You don't even know you have this problem" → Heavy context slides, educational progression

**EDUCATE + `most_aware`:**
"Advanced framework for those who already mastered the basics" → Dense content, expert-level, minimal context

### 12.2 Implementation

The awareness level is injected as Block 9 in the prompt:

```
AWARENESS CALIBRATION:
Your audience is at the "{awareness_level}" stage.
This means:
- Hook strategy: {hook_guidance}
- Content depth: {depth_guidance}
- CTA approach: {cta_guidance}
- Assumed knowledge: {knowledge_assumptions}
```

---

## 13. Smart Pillar Suggestion

### 13.1 Suggestion Logic

When the user opens /create, the system queries their last 10 posts and suggests a pillar:

| Condition | Suggestion |
|---|---|
| Last 3 posts all same pillar | Suggest a different pillar: "Time for variety?" |
| No CONVERT posts in 14 days AND `primary_goal` includes sales | "Time for a conversion post — it's been {X} days" |
| No PROVE posts in 10 days | "Show some results — your last proof post was {X} days ago" |
| Default | Suggest least-used pillar in last 14 days |

### 13.2 UI Treatment

The suggestion appears as a subtle badge ("★ Suggested") on the recommended pillar card. The user can always ignore it.

---

## 14. Product Seeding Gradient

### 14.1 Intensity Levels

| Level | Description | Applied When |
|---|---|---|
| `none` | Zero product mention | PROVOKE, CONNECT pillars |
| `whisper` | 1 subtle line in caption only | EDUCATE pillar |
| `mention` | Product woven into narrative (1-2 slides) | PROVE pillar |
| `full` | Entire post is the offer | CONVERT pillar |

### 14.2 Seed Generation

When `productMode = true` AND pillar has seeding:

```typescript
function generateProductSeed(pillar: PillarConfig, offers: UserOffer[]): ProductSeed | null {
  if (pillar.productSeedIntensity === 'none') return null;

  const primaryOffer = offers.find(o => o.is_primary) ?? offers[0];

  return {
    intensity: pillar.productSeedIntensity,
    offerName: primaryOffer.name,
    mainBenefit: primaryOffer.main_benefit,
    ctaKeyword: primaryOffer.cta_keyword,
    purchaseMethod: primaryOffer.purchase_method,
    placement: pillar.productSeedIntensity === 'whisper' ? 'caption' : 'slides',
  };
}
```

---

## 15. Schema & Data Model

### 15.1 Database Migration

```sql
-- Migration: Add pillar tracking to sf_posts
ALTER TABLE sf_posts ADD COLUMN IF NOT EXISTS pillar_id TEXT;
ALTER TABLE sf_posts ADD COLUMN IF NOT EXISTS hook_archetype TEXT;

-- Index for pillar analytics
CREATE INDEX IF NOT EXISTS idx_sf_posts_pillar_id ON sf_posts(pillar_id);
CREATE INDEX IF NOT EXISTS idx_sf_posts_user_pillar ON sf_posts(user_id, pillar_id);

-- Update generation_method check to include 'smart' if not already
-- (already supported per current schema)
```

### 15.2 New TypeScript Types

```typescript
// Content Pillars
type PillarId = 'educate' | 'provoke' | 'prove' | 'connect' | 'convert';

// Universal Slide Roles
type SlideRole = 'hook' | 'context' | 'content' | 'tension' | 'soft-cta' | 'cta';

// Hook Archetypes
type HookArchetypeId = 'direct-controversy' | 'specific-number' | 'transformative-promise'
                     | 'polarization' | 'curiosity-mystery' | 'social-proof';

// Source Types (existing, unchanged)
type SourceType = 'google_news' | 'reddit' | 'twitter';

// Scoring Weights
interface ScoringWeights {
  recency: number;
  engagement: number;
  relevance: number;
  richness: number;
}
```

---

## 16. API Contracts

### 16.1 Forge Personalized — Updated Request

```typescript
// POST /api/forge-personalized/generate
interface ForgePersonalizedRequest {
  url?: string;
  title?: string;
  summary?: string;
  rawContent?: string;
  category?: string;
  themeId: string;
  userId: string;
  pillarId?: PillarId;              // NEW — optional, defaults to 'educate'
  productMode?: boolean;
  offer?: UserOffer;
}
```

### 16.2 Forge Smart — Updated Request

```typescript
// POST /api/forge-smart/generate
interface ForgeSmartRequest {
  userId: string;
  themeId: string;
  pillarId: PillarId;               // NEW — required for Smart
  modelConfigId?: string;
  productMode?: boolean;
  offer?: UserOffer;
}
```

### 16.3 Forge Smart — Discovery Endpoint (NEW, P1)

```typescript
// POST /api/forge-smart/discover
// Returns top 3 candidates for user selection (does NOT generate carousel)
interface SmartDiscoverRequest {
  userId: string;
  pillarId: PillarId;
}

interface SmartDiscoverResponse {
  candidates: Array<{
    title: string;
    summary: string | null;
    url: string | null;
    source_type: SourceType;
    final_score: number;
    posted_at: string | null;
  }>;
  queriesUsed: string[];
  pillarId: PillarId;
}
```

### 16.4 Pillar Config Endpoint (NEW)

```typescript
// GET /api/pillars
// Returns pillar configs for frontend display
interface PillarDisplayConfig {
  id: PillarId;
  name: string;
  description: string;
  icon: string;
  slideRange: { min: number; max: number };
  ctaStyle: string;
}
```

---

## 17. Scope

### 17.1 IN Scope

| Item |
|---|
| Content Pillar system definition (5 pillars with full configs) |
| Forge Smart query generation per pillar |
| Forge Smart scoring per pillar (weights + source multipliers) |
| Forge Personalized prompt builder with PILLAR RULES block |
| Dynamic persona generation from Setup V2 |
| Theme refactor to pure visual design |
| Universal slide roles across all generation methods |
| /create page refactor with pillar selection step |
| Hook archetype system for personalized content |
| Awareness-level calibration in prompts |
| Smart pillar suggestion based on usage history |
| Product seeding gradient per pillar |
| Database migration (pillar_id, hook_archetype columns) |
| API contract updates for both Forge services |

### 17.2 OUT of Scope

| Item | Reason |
|---|---|
| Forge ShadowFeed changes | Admin system has its own pillar system — no changes needed |
| New visual themes | Can be added later as pure CSS/config — not part of this PRD |
| Tavily/Exa API integration | Future enhancement for Deep Research — not in V1 |
| YouTube transcript integration | Future enhancement — not in V1 |
| Content calendar/scheduling for users | Future feature — users generate on-demand |
| Pillar analytics dashboard | Future — track pillar_id first, build analytics later |
| Setup V3 changes | No changes to user onboarding flow |
| Smart auto-discovery top-3 UI | P1 — can ship with single-winner first |

---

## 18. Dependencies & Risks

### 18.1 Dependencies

| Dependency | Type | Impact |
|---|---|---|
| Setup V2 data completeness | Data | Pillars depend on Setup V2 fields being populated — fallbacks needed for partial profiles |
| Existing forge-personalized prompt builder | Code | Major refactor — must maintain backward compatibility during transition |
| Existing theme system consumers (frontend renderer) | Code | Theme refactor must not break carousel rendering |
| Content schema validation (Zod) | Code | Must update role enums without breaking existing validated posts |

### 18.2 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Theme refactor breaks existing post rendering | High | Keep backward compatibility: old posts with theme-embedded content rules still render correctly |
| Pillar selection adds friction to /create flow | Medium | Smart suggestion reduces decision fatigue; default to EDUCATE if user skips |
| LLM doesn't follow pillar rules consistently | Medium | Few-shot examples per pillar; validation rejects posts missing required elements |
| Setup V2 fields incomplete for some users | Medium | Graceful fallbacks: if `audience_frustration` is null, PROVOKE uses generic niche frustrations |

---

## 19. Epic Breakdown

### Epic: PDCE — Pillar-Driven Content Engine

**Suggested Story Sequence:**

| # | Story | Scope | Dependencies |
|---|---|---|---|
| S1 | **Pillar System Foundation** | Define `PillarId`, `PillarConfig` types, create pillar config objects for all 5 pillars, add `pillar_id` + `hook_archetype` columns to DB | None |
| S2 | **Universal Slide Roles** | Unify `SlideRole` enum, update Zod schemas, update content-validator, ensure backward compat | S1 |
| S3 | **Theme Refactor — Pure Design** | Strip content logic from `PostTheme`, migrate system prompts to pillar configs, update theme-applier | S2 |
| S4 | **Forge Personalized — Pillar Prompt Builder** | New 10-block prompt architecture, PILLAR RULES block, dynamic persona, awareness calibration | S1, S2, S3 |
| S5 | **Hook Archetype System** | 6 archetypes with personalized variables, pillar affinity selection, anti-repeat logic | S4 |
| S6 | **Forge Smart — Pillar-Driven Queries** | Per-pillar query angles, dynamic system prompt, query generation refactor | S1 |
| S7 | **Forge Smart — Pillar-Driven Scoring** | Per-pillar scoring weights, source weight multipliers, scorer refactor | S6 |
| S8 | **Product Seeding Gradient** | Pillar-based seed intensity, seed generation from offers[], prompt integration | S4 |
| S9 | **/create Page — Pillar Selection UI** | New step in flow, pillar cards, smart suggestion, theme preview refactor | S1, S3 |
| S10 | **/create Page — Smart Discovery UI** (P1) | Discovery endpoint, top-3 candidate display, source selection flow | S7, S9 |

### Suggested Wave Execution

**Wave 1 (Foundation):** S1, S2 (parallel)
**Wave 2 (Backend Core):** S3, S6 (parallel after Wave 1)
**Wave 3 (Intelligence):** S4, S7 (parallel after Wave 2)
**Wave 4 (Features):** S5, S8 (parallel after S4)
**Wave 5 (Frontend):** S9 (after S3)
**Wave 6 (Frontend P1):** S10 (after S7 + S9)

---

## 20. Verification Plan

### 20.1 Per-Story Verification

| Story | Verification Method |
|---|---|
| S1 | Unit tests for pillar config types, migration runs clean |
| S2 | Existing posts still validate, new posts use universal roles |
| S3 | Existing themes render correctly, new themes require only visual config |
| S4 | Generated prompts contain all 10 blocks, Setup V2 fields present |
| S5 | Hook selection respects pillar affinity, no repeat in last 2 |
| S6 | Query angles match pillar config, different pillars produce different queries |
| S7 | Same candidates score differently per pillar, source weights applied |
| S8 | EDUCATE posts have whisper seed, PROVOKE has none, CONVERT has full |
| S9 | /create flow includes pillar step, theme shows only visual info |
| S10 | Discovery endpoint returns 3 candidates, user can select one |

### 20.2 Integration Verification

| Test | Expected Result |
|---|---|
| Generate EDUCATE post via /create (manual URL) | 8-12 slides, teacher tone, save CTA, data-rich |
| Generate PROVOKE post via /create (manual URL) | 4-7 slides, confrontational, short punchy slides |
| Generate PROVE post via Smart (auto) | Case study found, 6-8 slides, metrics in content |
| Generate CONVERT post via /create (product mode ON) | Full offer integration, purchase_method CTA |
| Same URL, EDUCATE vs PROVOKE pillar | Fundamentally different carousel outputs |
| Same pillar, Magazine vs Twitter theme | Same content structure, different visual design |

---

*Document optimized for execution via Claude Code.*

— Morgan, planejando o futuro 📊
