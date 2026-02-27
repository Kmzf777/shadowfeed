# Admin Create Post — Pillar Selection PRD

> **Feature Codename:** ADMIN-CP — Admin Create Post with Pillar Selection
> **Type:** Frontend UX improvement + minor backend adjustment (brownfield)
> **Status:** Draft — Ready for Story Creation
> **Author:** @pm (Morgan)
> **Date:** 2026-02-26

---

## 1. Background & Diagnosis

### 1.1 Current State

The `/shadowfeedadmin` dashboard has a **"GENERATE NEXT BATCH"** button that triggers automatic post generation. The system picks the content pillar automatically based on the weekly cadence schedule (day-of-week → pillar mapping). The admin has **zero control** over which pillar gets generated.

### 1.2 Problem

When the admin wants to create a post for a specific content pillar (e.g., "Brand Breakdown" on a Monday, which is normally an "Educational Value" day), there is no way to do it from the UI. The admin is locked into the cadence schedule.

### 1.3 Why This Matters

- **Content flexibility** — Sometimes breaking the cadence is strategically correct (trending topic, brand event, campaign launch)
- **Testing & iteration** — Admins need to test specific pillars without waiting for the right day
- **Creative control** — The cadence is a guideline, not a prison

---

## 2. Goals

| # | Goal |
|---|---|
| G1 | Give the admin the ability to choose a content pillar before generating a post |
| G2 | Preserve the existing generation pipeline — only the pillar selection changes |
| G3 | Keep the UX minimal and consistent with the existing admin dark theme |

---

## 3. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR1 | Replace "GENERATE NEXT BATCH" button on the dashboard with a "CREATE NEW POST" button |
| FR2 | "CREATE NEW POST" button navigates to a new page `/shadowfeedadmin/create-post` |
| FR3 | The create-post page displays all 5 active pillars as selectable cards |
| FR4 | Each pillar card shows: pillar name, content type description, slide range, and scheduled time |
| FR5 | Admin selects exactly one pillar before generating |
| FR6 | A "GENERATE" button on the create-post page triggers generation with the selected pillar |
| FR7 | The backend `POST /api/forge-shadowfeed/generate-batch` accepts an optional `pillarId` body parameter |
| FR8 | When `pillarId` is provided, the backend uses it instead of the cadence-based pillar selection |
| FR9 | When `pillarId` is NOT provided (scheduler/legacy calls), behavior remains unchanged (cadence-based) |
| FR10 | After successful generation, redirect the admin back to the dashboard |
| FR11 | Show generation progress (loading state) and result (success/error) on the create-post page |

---

## 4. Non-Functional Requirements

| ID | Requirement |
|----|-------------|
| NFR1 | The create-post page must follow the existing admin design system (dark theme, `#0a0a0a` bg, `#8a00c4` accent, font-mono, `rounded-[3px]` borders) |
| NFR2 | No new API endpoints — reuse existing `POST /generate-batch` with optional body param |
| NFR3 | No database schema changes required |
| NFR4 | Page must be admin-token protected (same auth as all `/shadowfeedadmin/*` routes) |

---

## 5. UI Design

### 5.1 Dashboard Change

The current `BatchGenerator` component button text changes from:
```
⚡ GENERATE NEXT BATCH
```
to a navigation link:
```
⚡ CREATE NEW POST  →  navigates to /shadowfeedadmin/create-post
```

### 5.2 Create Post Page (`/shadowfeedadmin/create-post`)

```
┌─────────────────────────────────────────────────────┐
│  SF://ADMIN  [DASHBOARD] [POSTS] [STATS]            │
│                                                     │
│  ← Back to Dashboard                                │
│                                                     │
│  CREATE NEW POST                                    │
│  Select a content pillar to generate                │
│                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ │
│  │ EDUCATIONAL  │ │  WAKE-UP     │ │    BRAND     │ │
│  │   VALUE      │ │   SLAP       │ │  BREAKDOWN   │ │
│  │              │ │              │ │              │ │
│  │ tutorials    │ │ controversy  │ │ brand-analysis│ │
│  │ 8-12 slides  │ │ 4-6 slides   │ │ 10-14 slides │ │
│  │ 09:00        │ │ 11:00        │ │ 14:00        │ │
│  │  [selected]  │ │              │ │              │ │
│  └──────────────┘ └──────────────┘ └──────────────┘ │
│                                                     │
│  ┌──────────────┐ ┌──────────────┐                  │
│  │ PROOF SOCIAL │ │  THE OFFER   │                  │
│  │              │ │              │                  │
│  │ results/bts  │ │ direct-sale  │                  │
│  │ 6-8 slides   │ │ 8-10 slides  │                  │
│  │ 17:00        │ │ 20:00        │                  │
│  └──────────────┘ └──────────────┘                  │
│                                                     │
│          [⚡ GENERATE]  (disabled until selected)    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

- Selected pillar gets a `#8a00c4` border highlight
- Unselected pillars have default `border-white/10`
- The cadence-recommended pillar for today is subtly indicated (e.g., "Today's cadence" badge)

---

## 6. Technical Architecture

### 6.1 Backend Change

**File:** `src/modules/forge-shadowfeed/forge-shadowfeed.controller.ts`

```
POST /api/forge-shadowfeed/generate-batch
Body (optional): { "pillarId": "brand-breakdown" }
```

**File:** `src/modules/forge-shadowfeed/forge-shadowfeed.service.ts`

```typescript
// Current signature:
async generateBatch(): Promise<BatchGenerationResult>

// New signature:
async generateBatch(pillarId?: PillarId): Promise<BatchGenerationResult>
```

When `pillarId` is provided:
- Skip `getTodayCadence()` pillar selection
- Use the provided `pillarId` directly
- Still use cadence data for hook archetypes and funnel tier (or derive from pillar defaults)
- All other pipeline steps remain identical

### 6.2 Frontend Files

| File | Change |
|------|--------|
| `web/src/app/shadowfeedadmin/page.tsx` | Replace `<BatchGenerator>` with a `<Link>` to `/shadowfeedadmin/create-post` |
| `web/src/app/shadowfeedadmin/create-post/page.tsx` | **NEW** — Pillar selection + generate page |
| `web/src/app/shadowfeedadmin/components/BatchGenerator.tsx` | Remove or repurpose (can be deleted if unused) |

### 6.3 Existing Endpoint Reuse

The backend already has `POST /generate/:pillarId` (line 80-87 in controller). However, that endpoint bypasses cadence recording and batch result format. The cleaner approach is extending `generate-batch` with an optional body param to keep the full pipeline (cadence history, queue scheduling, batch result format).

---

## 7. Scope

### IN Scope

- New `/shadowfeedadmin/create-post` page with pillar selection UI
- Dashboard button change from "Generate Next Batch" to "Create New Post" link
- Backend `generateBatch(pillarId?)` optional parameter
- Admin token authentication on new page
- Loading/error/success states
- "Today's cadence" indicator on the recommended pillar

### OUT of Scope

- Changing the automated scheduler (still uses cadence)
- Hook archetype selection UI (uses defaults/cadence)
- Theme selection UI (auto-selected as before)
- Template selection UI (auto-rotated as before)
- Discovery vs template toggle (auto-decided by discoveryRatio)
- Any database schema changes

---

## 8. Epic Breakdown

### Epic 1: Admin Create Post with Pillar Selection

**Goal:** Replace the one-click "Generate Next Batch" button with a pillar-aware "Create New Post" flow, giving the admin control over which content pillar to generate while preserving the full generation pipeline.

#### Story 1.1 — Backend: Accept optional pillarId in generate-batch

> As an admin,
> I want the batch generation API to accept an optional pillar override,
> so that I can generate content for any pillar regardless of the weekly cadence.

**Acceptance Criteria:**
1. `POST /api/forge-shadowfeed/generate-batch` accepts optional JSON body `{ "pillarId": "<PillarId>" }`
2. When `pillarId` is provided and valid, that pillar is used for generation instead of cadence
3. When `pillarId` is omitted or empty, cadence-based selection is used (existing behavior)
4. When `pillarId` is invalid (not in PILLARS list), return 400 with error message
5. Cadence history is still recorded for the generated post
6. All other pipeline steps (theme rotation, hook archetype, funnel tier, discovery, scheduling) work as before
7. Existing scheduler calls (no body) continue to work without changes

#### Story 1.2 — Frontend: Create Post page with pillar selection

> As an admin,
> I want a dedicated page where I can select a content pillar and generate a post,
> so that I have visual control over the type of content being created.

**Acceptance Criteria:**
1. New page at `/shadowfeedadmin/create-post` with admin auth protection
2. Displays all 5 active pillars as selectable cards in a responsive grid
3. Each card shows: pillar name, content type, slide range (min-max), and scheduled time
4. Today's cadence pillar is visually indicated with a "Today's pick" badge
5. Clicking a card selects it (highlighted with `#8a00c4` border); only one can be selected
6. "GENERATE" button is disabled until a pillar is selected
7. Clicking "GENERATE" calls `POST /api/forge-shadowfeed/generate-batch` with `{ pillarId: selectedPillar }`
8. Shows loading spinner during generation (replacing button text with "GENERATING...")
9. On success, shows success message and redirects to dashboard after 2 seconds
10. On error, shows error message with option to retry
11. "Back to Dashboard" link at the top navigates to `/shadowfeedadmin`
12. Page follows existing admin design system (dark theme, monospace fonts, `rounded-[3px]`)

#### Story 1.3 — Dashboard: Replace batch button with Create New Post link

> As an admin,
> I want the dashboard to link to the new Create Post page,
> so that the old one-click generation is replaced with the pillar-aware flow.

**Acceptance Criteria:**
1. The `BatchGenerator` component on the dashboard is replaced with a "CREATE NEW POST" link
2. The link navigates to `/shadowfeedadmin/create-post`
3. The link uses the same visual style as the previous button (purple accent, Zap icon)
4. The navigation bar includes a link to the create-post page for easy access
5. The `BatchGenerator.tsx` component file is removed if no longer used anywhere
6. All other dashboard functionality remains unchanged (stats, queue, recent posts, publish toggle)

---

## 9. Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| Admin generates multiple posts for same pillar/date | Existing upsert constraint on `(pillar_id, scheduled_date)` prevents duplicates — generation will update the existing queue entry |
| Cadence history becomes inaccurate with manual overrides | Still record cadence; the history reflects what was actually generated, not what was scheduled |
| Automated scheduler still calls `generateBatch()` without body | No-body calls default to cadence — zero impact on automation |

---

## 10. Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-26 | 1.0 | Initial PRD | @pm (Morgan) |

---

*— Morgan, planejando o futuro*
