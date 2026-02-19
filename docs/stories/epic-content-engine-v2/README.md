# Epic: CONTENT-ENGINE-V2 — Content Engine v2.0

**Epic Codename:** CONTENT-ENGINE-V2
**PRD:** `docs/prd-content-engine-v2.md`
**Status:** Draft
**Created:** 2026-02-19

---

## Epic Summary

Transform ShadowFeed's content generation into a strategically aware system that understands the creator's business identity, audience psychology, and goals — producing posts that actually engage, sell, and teach for any niche.

**3 Core Problems Solved:**
1. **No strategic context** — AI doesn't know what the creator sells, their CTA, or their pillars
2. **No content type differentiation** — all posts use the same generic structure
3. **Fixed depth** — 5–15 slides regardless of content richness

---

## Stories

| Story | ID | Title | Priority | Status | Depends On |
|---|---|---|---|---|---|
| 2.1 | CE-01 | DB Migration: Setup v2 User Profile | P0 Critical | Draft | — |
| 2.2 | CE-02 | Content Schema & Types Foundation | P0 Critical | Draft | 2.1 |
| 2.3 | CE-03 | Modular Prompt Builder (7 Modules) | P0 | Draft | 2.2 |
| 2.4 | CE-04 | Setup Wizard v2 (5-Step Strategic) | P0 | Draft | 2.1 |
| 2.5 | CE-05 | Forge Personalized v2 (Type Routing) | P1 | Draft | 2.2, 2.3 |
| 2.6 | CE-06 | Forge Smart v2 + Content Rotation | P1 | Draft | 2.2 |
| 2.7 | CE-07 | Create Page v2 (Frontend) | P1 | Draft | 2.5, 2.6 |
| 2.8 | CE-08 | Critical Fixes & Integration Polish | P2 | Draft | 2.5–2.7 |

---

## Execution Order

```
FASE 1 — Blocking Foundation (P0)
  2.1 DB Migration ──────────────────────────────── (blocking)
  2.2 Content Schema & Types ────────────────────── (blocking, depends 2.1)

FASE 2 — Parallel Development (P0)
  2.3 Modular Prompt Builder ────┐
  2.4 Setup Wizard v2 ───────────┘  (parallel, both depend on 2.1/2.2)

FASE 3 — Integration (P1, depend on Fase 2)
  2.5 Forge Personalized v2 ─────┐
  2.6 Forge Smart v2 + Rotation ─┤  (can run parallel)
  2.7 Create Page v2 ────────────┘  (depends on 2.5 + 2.6)

FASE 4 — Polish (P2)
  2.8 Critical Fixes & Polish ──────── (depends on all above)
```

---

## Key Technical Files

### New Files
- `supabase-migrations/024_setup_v2_user_profile.sql`
- `supabase-migrations/025_posts_content_type.sql`
- `src/shared/types/content-types.types.ts`
- `src/modules/forge-personalized/prompts/` (8 files)
- `src/modules/forge-smart/content-type-selector.ts`
- `web/src/app/create/components/ContentTypeSelector.tsx`
- `web/src/app/create/components/DepthSelector.tsx`
- `web/src/app/create/components/ContentTypeSuggestion.tsx`
- `web/src/lib/constants/pillar-suggestions.ts`

### Modified Files
- `src/shared/schemas/content-schema.ts` (4–20 slides, new roles)
- `src/shared/schemas/content-validator.ts` (depth validation)
- `src/modules/forge-personalized/prompt-builder.ts` (orchestrator)
- `src/modules/forge-personalized/forge-personalized.service.ts`
- `src/modules/forge-personalized/forge-personalized.types.ts`
- `src/modules/forge-smart/forge-smart.service.ts` (Stage 0)
- `src/modules/forge-smart/forge-smart.types.ts`
- `src/modules/forge-smart/smart-query-generator.ts`
- `web/src/app/setup/page.tsx` (5-step refactor)
- `web/src/app/create/page.tsx` (type+depth selection)

---

## Content Types Implemented

| Type | Emoji | Needs Source | Depths |
|---|---|---|---|
| educational | 📚 | Yes | shallow, balanced, dense |
| tutorial | 🎯 | No | balanced, dense |
| sales | 💰 | No | shallow, balanced |
| authority | 🏆 | Yes | balanced, dense |
| story | ✍️ | No | shallow, balanced |
| list | 📋 | Yes | shallow, balanced, dense |
| controversy | 🔥 | No | shallow, balanced |

---

## Definition of Done (Epic)

- [ ] All 8 stories at status Done
- [ ] End-to-end flow works for all 7 content types
- [ ] New users complete 5-step setup successfully
- [ ] Existing (v1) users not broken
- [ ] Rotation prevents same type in 2 consecutive posts
- [ ] Dense posts (15–20 slides) validate and generate correctly
- [ ] All PRD §12 critical fixes in place
- [ ] `npm run typecheck` clean
- [ ] `npm run lint` clean
