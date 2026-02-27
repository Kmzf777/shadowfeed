# Epic: FS-DECODED — Forge ShadowFeed v2 Decoded Content Machine

**Epic Codename:** FS-DECODED
**PRD:** `docs/prd/prd-forge-shadowfeed-v2-decoded-machine.md`
**Research Base:** `/pesquisabrandsdecoded.md` (Brand Spy Report — @brandsdecoded__)
**Status:** Ready for Story Creation
**Created:** 2026-02-25
**Author:** @pm (Morgan)
**Builds on:** Epic FORGE-SHADOWFEED v1 (FS-01 to FS-11) — brownfield overhaul

---

## Epic Summary

Overhaul the forge-shadowfeed engine to replicate the @brandsdecoded__ content machine strategy. The v1 system has 4 pillars with generic hooks, no funnel awareness, and shallow discovery. The v2 system implements the full Decoded formula: 5-pillar system with exact proportions (30/25/20/15/10), 6 hook archetypes, 7-zone carousel anatomy, 3-phase copy progression, 70/20/10 conversion pyramid with double-door product seeding, deep discovery with article scraping + LLM summarization, and weekly day-of-week cadence.

**Core Deliverables:**
1. 5-pillar system with correct proportions and new pillar types (`brand-breakdown`, `proof-social`)
2. Discovery Engine v2 with article body scraping + ResearchDigest extraction
3. Content Strategy Engine (persona, copy phases, contextual CTAs, 7-zone validator)
4. Hook Archetype System (6 archetypes with weighted selection)
5. Conversion Pyramid + Double Door (funnel tracking + product seed injection)
6. Weekly Cadence System (day-of-week → pillar mapping)

---

## Parallelism Map

```
WAVE 1 — Foundation (blocking)
  FSD-01  Pillar System v2 ─────────────── (types, PILLARS const, migration, base templates)
                                            No deps, blocks EVERYTHING

WAVE 2 — Core (parallel pair)
  FSD-02  Discovery Engine v2 ──────┐       (scraper + summarizer + discovery service)
  FSD-03  Content Strategy Engine ──┘       (persona + copy phases + validator + few-shots)
                                            Both depend on FSD-01, run in PARALLEL

WAVE 3 — Strategy (parallel pair)
  FSD-04  Hook Archetype System ────┐       (6 archetypes + weighted selection + prompt)
  FSD-05  Conversion Pyramid ───────┘       (funnel tracking + double door + seeds)
                                            FSD-04 depends on FSD-01
                                            FSD-05 depends on FSD-01 + FSD-03
                                            Can run in PARALLEL

WAVE 4 — Integration (blocking)
  FSD-06  Weekly Cadence System ────────── (day-of-week + batch integration)
                                            Depends on FSD-01 + FSD-04 + FSD-05
```

### Quick Dependency Reference

| Story | Depends On | Can Parallel With |
|-------|-----------|-------------------|
| FSD-01 | None | None (foundation) |
| FSD-02 | FSD-01 | **FSD-03** |
| FSD-03 | FSD-01 | **FSD-02** |
| FSD-04 | FSD-01 | **FSD-05** |
| FSD-05 | FSD-01, FSD-03 | **FSD-04** |
| FSD-06 | FSD-01, FSD-04, FSD-05 | None (integrates all) |

---

## Stories

| # | ID | Title | Priority | Complexity | Status | Depends On | PRD §§ |
|---|---|---|---|---|---|---|---|
| 1 | FSD-01 | Pillar System v2: Types, Constants, Migration, Base Templates | P0 Critical | L | Ready | — | §5 FR-PIL, §9, §4.1 |
| 2 | FSD-02 | Discovery Engine v2: Scraper + Summarizer + Pipeline | P0 Critical | L | Ready | FSD-01 | §7, §5 FR-DISC, §4.7 |
| 3 | FSD-03 | Content Strategy Engine: Persona, Copy Phases, Validator, Few-Shots | P0 Critical | L | Ready | FSD-01 | §8, §5 FR-COPY, FR-STRUCT, §4.3, §4.4 |
| 4 | FSD-04 | Hook Archetype System: 6 Archetypes + Weighted Selection | P1 | M | Ready | FSD-01 | §5 FR-HOOK, §8.1, §4.2 |
| 5 | FSD-05 | Conversion Pyramid + Double Door: Funnel Tracking + Seed System | P1 | M | Ready | FSD-01, FSD-03 | §5 FR-FUNNEL, §8.2, §4.5 |
| 6 | FSD-06 | Weekly Cadence System: Day-of-Week Calendar + Batch Integration | P1 | M | Ready | FSD-01, FSD-04, FSD-05 | §5 FR-CAD, §8.3, §4.6 |

---

## Story → Acceptance Criteria Mapping

### FSD-01: Pillar System v2
- [ ] AC1: Five pillar IDs defined in types with correct proportions (30/25/20/15/10)
- [ ] AC2: PILLARS constant updated with new configs (times, slides, discoveryRatio)
- [ ] AC3: Template files created for all 5 pillars (30 templates MVP, 50 target)
- [ ] AC4: Migration `030_forge_shadowfeed_v2_decoded.sql` runs without error, legacy IDs preserved
- [ ] AC5: `generatePillar()` accepts all 5 new pillar IDs

### FSD-02: Discovery Engine v2
- [ ] AC1: Winner scraper implemented, reuses `scrapeBlogUrl()` from url-scraper.ts
- [ ] AC2: Content summarizer extracts ResearchDigest (dataPoints, angles, brands)
- [ ] AC3: Discovery service orchestrates 6-stage pipeline
- [ ] AC4: PromptSource union type includes `research` with ResearchDigest
- [ ] AC5: Prompt Block 4 includes full data points and article body
- [ ] AC6: Discovery failure gracefully falls back to template
- [ ] AC7: >70% of discovery winners have scraped_body >200 chars

### FSD-03: Content Strategy Engine
- [ ] AC1: Persona rewritten with Decoded-inspired voice rules
- [ ] AC2: 3-phase copy system (interruption → development → conversion) in prompt
- [ ] AC3: Contextual CTAs mapped per pillar (save/comment/share/link)
- [ ] AC4: New slide roles (context, tension, soft-cta) in content validator
- [ ] AC5: Few-shot examples rewritten for all 5 pillars

### FSD-04: Hook Archetype System
- [ ] AC1: 6 archetypes defined with structure templates, examples, pillar affinities
- [ ] AC2: Weighted selection with anti-repeat (no same archetype in 2 consecutive posts)
- [ ] AC3: Hook archetype injected into prompt Block 2
- [ ] AC4: `hook_archetype` saved to queue and post records
- [ ] AC5: FR-HOOK-07 enforced: hook slide is declarative, never interrogative

### FSD-05: Conversion Pyramid + Double Door
- [ ] AC1: `funnel_tier` tracked on every generated post (top/middle/bottom)
- [ ] AC2: Double-door seed system maps pillar → product mention
- [ ] AC3: Seed injected into prompt (whisper/mention/spotlight intensity)
- [ ] AC4: >90% of non-offer posts contain product seed in caption or slide
- [ ] AC5: Offer pillar includes price anchoring + social proof + guarantee slides

### FSD-06: Weekly Cadence System
- [ ] AC1: Day-of-week → pillar mapping implemented
- [ ] AC2: `generateBatch()` uses cadence instead of all-pillar cycling
- [ ] AC3: Cadence table tracks weekly generation history
- [ ] AC4: `GET /cadence` and `GET /cadence/today` endpoints operational
- [ ] AC5: >80% of posts match day-of-week pillar plan over 30 days

---

## Key Technical Files

### Modified Files (from v1)
- `src/modules/forge-shadowfeed/forge-shadowfeed.types.ts` — 5 pillar types, new unions
- `src/modules/forge-shadowfeed/forge-shadowfeed.service.ts` — cadence, discovery v2
- `src/modules/forge-shadowfeed/forge-shadowfeed.controller.ts` — new endpoints
- `src/modules/forge-shadowfeed/shadowfeed-prompt-builder.ts` — 9-block rewrite
- `src/modules/forge-shadowfeed/shadowfeed-persona.ts` — Decoded voice
- `src/modules/forge-shadowfeed/shadowfeed-constants.ts` — CTAs, caption styles
- `src/modules/forge-shadowfeed/shadowfeed-few-shots.ts` — new examples
- `src/modules/forge-shadowfeed/template-rotation.ts` — 5 pillars

### New Files
- `src/modules/forge-shadowfeed/shadowfeed-hook-archetypes.ts`
- `src/modules/forge-shadowfeed/shadowfeed-double-door.ts`
- `src/modules/forge-shadowfeed/shadowfeed-weekly-cadence.ts`
- `src/modules/forge-shadowfeed/discovery/shadowfeed-winner-scraper.ts`
- `src/modules/forge-shadowfeed/discovery/shadowfeed-content-summarizer.ts`
- `src/modules/forge-shadowfeed/discovery/shadowfeed-discovery.service.ts`

### New Pillar Template Files
- `src/modules/forge-shadowfeed/pillar-templates/educational-value.templates.ts`
- `src/modules/forge-shadowfeed/pillar-templates/wake-up-slap.templates.ts` (rewrite)
- `src/modules/forge-shadowfeed/pillar-templates/brand-breakdown.templates.ts`
- `src/modules/forge-shadowfeed/pillar-templates/proof-social.templates.ts`
- `src/modules/forge-shadowfeed/pillar-templates/the-offer.templates.ts` (rewrite)

### New Migration
- `supabase-migrations/030_forge_shadowfeed_v2_decoded.sql`

---

## Verification Plan (End-to-End)

| # | Test | Validates |
|---|---|---|
| 1 | Generate `educational-value` → verify 8-12 slides, declarative hook | FSD-01, FSD-04 |
| 2 | Generate `wake-up-slap` → verify 4-6 slides, polarizing copy | FSD-01, FSD-03 |
| 3 | Generate `brand-breakdown` → verify brand name in content | FSD-01, FSD-02 |
| 4 | Generate `proof-social` → verify product seed present | FSD-05 |
| 5 | Generate `the-offer` → verify price anchoring + guarantee | FSD-01, FSD-05 |
| 6 | Generate 10 posts → verify all 6 hook archetypes appear | FSD-04 |
| 7 | Discovery winner with URL → verify scraped_body >200 chars | FSD-02 |
| 8 | ResearchDigest output → verify dataPoints[] non-empty | FSD-02 |
| 9 | Generate batch on Monday → verify `educational-value` selected | FSD-06 |
| 10 | Generate 30 posts → verify ~30/25/20/15/10 distribution | FSD-01 |
| 11 | Audit captions → verify >90% non-offer posts have product seed | FSD-05 |
| 12 | Check slide roles → verify context/tension/soft-cta present | FSD-03 |

---

## Definition of Done (Epic)

- [ ] All 6 stories at status Done
- [ ] 5 pillars generate successfully with correct proportions (±5%)
- [ ] Discovery v2 scrapes article bodies (>70% success rate)
- [ ] Hook archetype system cycles through all 6 types
- [ ] Double-door seeds present in >90% of non-offer posts
- [ ] Weekly cadence produces correct day-of-week pillar mapping
- [ ] New migration applied, legacy data preserved
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean
- [ ] All 12 verification tests pass

---

## Change Log

| Date | Author | Change |
|---|---|---|
| 2026-02-25 | @pm (Morgan) | Epic created from finalized PRD |
| 2026-02-25 | @po (Pax) | All 6 stories validated (GO Conditional → fixes applied → Ready). Added Risks, DoD to all. Added AC6 + Task 5 + controller to FSD-04 file list for missing /hook-archetypes endpoint |
