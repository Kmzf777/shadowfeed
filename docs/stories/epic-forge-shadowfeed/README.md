# Epic: FORGE-SHADOWFEED — Self-Promotion Content Engine

**Epic Codename:** FORGE-SHADOWFEED
**Spec:** `docs/spec-forge-shadowfeed-engine.md`
**Status:** Draft
**Created:** 2026-02-20

---

## Epic Summary

Build an autonomous content engine for the @shadowfeed.ai Instagram account. The system generates 4 strategic carousels per day (4 pillars), with a unique AI-sentient persona voice, Brazil-focused discovery engine, exclusive visual theme, admin panel for review/approval, and automated publishing via Playwright.

**Core Deliverables:**
1. `forge-shadowfeed` backend module (generation engine with 4 pillar system)
2. `shadowfeed-publisher` module (Playwright-based Instagram automation)
3. `/shadowfeedadmin` frontend (dashboard + post review panel)
4. Discovery engine with Brazil-focused sources (Google News BR, Reddit BR, Twitter BR)
5. Exclusive `shadowfeed-brand` visual theme

---

## Parallelism Map

```
PHASE 1 — Foundation (blocking)
  3.1 DB Migrations ──────────────────────────── (no deps, blocks everything)

PHASE 2 — Scaffolding (parallel pair)
  3.2 Module Scaffold + Types ─────┐
  3.8 Playwright Publisher ────────┘  (both depend only on 3.1, run in PARALLEL)

PHASE 3 — Core Features (parallel quad)
  3.3 Pillar Templates Library ────┐
  3.4 Discovery Engine BR ─────────┤  (3.3, 3.4, 3.7 depend on 3.2)
  3.7 ShadowFeed Brand Theme ─────┤  (3.9 depends on 3.8)
  3.9 Scheduler + Cron ────────────┘  (all 4 run in PARALLEL)

PHASE 4 — Assembly
  3.5 Prompt Builder + Persona ──────── (depends on 3.3 + 3.4)

PHASE 5 — Orchestration
  3.6 Batch Generation + Queue ──────── (depends on 3.5)

PHASE 6 — Frontend
  3.10 Admin Dashboard + Posts Page ─── (depends on 3.6 + 3.8)

PHASE 7 — Integration
  3.11 End-to-End Test + Polish ─────── (depends on ALL above)
```

### Quick Parallel Reference

| Story | Can Run In Parallel With |
|-------|--------------------------|
| 3.1 | None (foundation) |
| 3.2 | **3.8** |
| 3.3 | **3.4, 3.7, 3.9** |
| 3.4 | **3.3, 3.7, 3.9** |
| 3.5 | None (waits for 3.3 + 3.4) |
| 3.6 | None (waits for 3.5) |
| 3.7 | **3.3, 3.4, 3.9** |
| 3.8 | **3.2** |
| 3.9 | **3.3, 3.4, 3.7** |
| 3.10 | None (waits for 3.6 + 3.8) |
| 3.11 | None (final integration) |

---

## Stories

| Story | ID | Title | Priority | Complexity | Status | Depends On |
|---|---|---|---|---|---|---|
| 3.1 | FS-01 | DB: Migrations + Tables (queue, config) | P0 Critical | S | Draft | — |
| 3.2 | FS-02 | Backend: Module Scaffold + Types | P0 Critical | M | Draft | 3.1 |
| 3.3 | FS-03 | Backend: Pillar Templates Library (50+) | P0 | M | Draft | 3.2 |
| 3.4 | FS-04 | Backend: Discovery Engine BR | P0 | L | Draft | 3.2 |
| 3.5 | FS-05 | Backend: Prompt Builder + Persona | P0 | L | Draft | 3.3, 3.4 |
| 3.6 | FS-06 | Backend: Batch Generation + Queue + Approval | P0 | M | Draft | 3.5 |
| 3.7 | FS-07 | Theme: ShadowFeed Brand Exclusive | P1 | M | Draft | 3.2 |
| 3.8 | FS-08 | Publisher: Playwright Instagram Session + Poster | P1 | L | Draft | 3.1 |
| 3.9 | FS-09 | Publisher: Scheduler + Publish Webhook | P1 | M | Draft | 3.8 |
| 3.10 | FS-10 | Frontend: /shadowfeedadmin Dashboard + Posts Review | P1 | M | Draft | 3.6, 3.8 |
| 3.11 | FS-11 | Integration: End-to-End Test + Polish | P2 | M | Draft | 3.1–3.10 |

---

## Key Technical Files

### New Modules
- `src/modules/forge-shadowfeed/` (entire module — 10+ files)
- `src/modules/shadowfeed-publisher/` (3 files)
- `web/src/app/shadowfeedadmin/` (dashboard + posts review + components)

### New Migrations
- `supabase-migrations/026_shadowfeed_queue.sql`
- `supabase-migrations/027_shadowfeed_config.sql`

### Modified Files
- `src/config/env.ts` (new env vars)
- `src/shared/schemas/post-themes.library.ts` (add `shadowfeed-brand` theme)
- `src/modules/forge-smart/smart-content-fetcher.ts` (reuse for BR sources)
- `src/modules/forge-smart/smart-content-scorer.ts` (reuse with different weights)

---

## Definition of Done (Epic)

- [ ] All 11 stories at status Done
- [ ] 4 pillars generate successfully via `/api/forge-shadowfeed/generate-batch`
- [ ] Discovery engine returns relevant BR trending content
- [ ] `shadowfeed-brand` theme renders correctly (CRT scanline, purple gradient, ghost logo)
- [ ] Admin dashboard shows queue status, recent posts, session status
- [ ] Post review page allows preview, caption edit, and approval
- [ ] Playwright publishes approved carousel to Instagram successfully
- [ ] Scheduler triggers publish-check at correct BRT times
- [ ] Auto-publish toggle works (ON = skip manual approval)
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean
