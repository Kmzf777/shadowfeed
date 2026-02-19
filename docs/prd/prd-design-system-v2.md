# SHADOWFEED DESIGN SYSTEM v2.0 — PRD

> **Feature Codename:** DS-TERMINAL — Design System Terminal/VSCode/Hack
> **Type:** Full-frontend design overhaul (brownfield)
> **Status:** Ready for Epic & Story Creation
> **Author:** @pm (Morgan) · Research by @analyst (Atlas)
> **Date:** 2026-02-18
> **Document optimized for execution via Claude Code.**

---

## Table of Contents

1. [Background & Diagnosis](#1-background--diagnosis)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Target Users](#3-target-users)
4. [Functional Requirements](#4-functional-requirements)
5. [Technical Architecture](#5-technical-architecture)
6. [Route & UX Improvements](#6-route--ux-improvements)
7. [Animation System](#7-animation-system)
8. [Acceptance Criteria by Epic](#8-acceptance-criteria-by-epic)
9. [Scope](#9-scope)
10. [Dependencies & Risks](#10-dependencies--risks)
11. [Epic Breakdown](#11-epic-breakdown)

---

## 1. Background & Diagnosis

### 1.1 Current State

The Shadowfeed frontend was built incrementally, resulting in visual inconsistency across all 12 routes. A @analyst audit identified the following structural problems:

**Design inconsistencies:**
- `rgba(255,255,255,0.05)` and `rgba(255,255,255,0.12)` used as background/border colors — creates glassmorphism that contradicts the brand identity
- `backdrop-filter: blur(20px)` applied on cards and modals — expensive, inconsistent, wrong aesthetic
- Border radius: `3px`, `8px`, `12px` all coexist with no system — violates brand rule
- `--shadow-card: 0 0 30px rgba(138,0,196,0.15)` — purple glow on every card dilutes the impact of the accent color

**Typography inconsistency:**
- `globals.css` sets `DejaVu Sans Mono` as global font (correct, terminal-aligned)
- `layout.tsx` loads Sora, DM Sans, Inter, Inter Tight — some are used, some are not
- The monospace font is already the foundation; the system just needs consistency

**Route problems:**
- `/criar-post` — Portuguese route name in an English-migrated app
- `/manual` — Legacy page with **light theme** (`gray-50` bg) inside a dark app. Severe visual break
- `/my-account/plan` vs `/my-account/plans` — Single letter difference, completely different functions (billing vs marketplace). Confusion for users
- `/reception` — Unnecessary landing hop before `/login`. Pure friction for returning users

**UX structure problems:**
- `/setup` has 7 steps (excessive for professional onboarding)
- `/create` and `/setup` wizards display the full app sidebar — navigation noise during focused flows
- `/posts/[id]` has `AuthGuard` but `/` shows public posts — inconsistent access policy; users who click a shared post link get redirected to login

### 1.2 Brand Identity Analysis

The Shadowfeed logo communicates:
- **Ghost entity** with aggressive expression → tense, not friendly
- **Digital glitch / scan lines** → disruption, technology, hack
- **Sharp diagonal trails** → speed, instability, restlessness
- **Electric purple on deep black** → brand contrast via saturation, not softness

This identity demands: **solid, opaque, sharp, monospace, tense**. The current glassmorphism aesthetic is the opposite of the brand.

### 1.3 Opportunity

The terminal/VSCode/hack aesthetic is naturally aligned with:
1. The existing DejaVu Sans Mono global font (already in place)
2. The aggressive ghost mascot
3. The professional SaaS positioning ("marketing ácido")
4. The Rubik Glitch font already imported (underutilized)

A cohesive application of these elements creates a unique, highly recognizable UI that no competitor has.

---

## 2. Goals & Success Metrics

### Goals

| # | Goal | Priority |
|---|------|----------|
| G1 | Replace all glassmorphism with solid opaque surfaces | Must Have |
| G2 | Standardize border-radius to `3px` across all UI | Must Have |
| G3 | Establish a VSCode-depth color hierarchy (5 surface levels) | Must Have |
| G4 | Implement terminal animation system for `/reception` and `/setup` | Must Have |
| G5 | Maintain permanent background logo watermark on all pages | Must Have |
| G6 | Fix route naming inconsistencies (EN) | Should Have |
| G7 | Reduce `/setup` from 7 to 4 steps | Should Have |
| G8 | Remove sidebar from wizard flows (`/setup`, `/create`) | Should Have |
| G9 | Deprecate `/manual` (legacy light-theme page) | Should Have |
| G10 | Fix `/posts/[id]` AuthGuard inconsistency | Should Have |

### Success Metrics

| Metric | Target |
|--------|--------|
| All `rgba(255,255,255/*)` backgrounds → solid equivalents | 100% |
| All `backdrop-filter: blur` removed | 100% |
| All border-radius values → `3px` (or `50%` for avatars only) | 100% |
| `/manual` page deprecated with 301 redirect | Done |
| `/criar-post` renamed to `/create` | Done |
| `/setup` steps: 7 → 4 | Done |
| Logo watermark visible on all routes | 100% |
| Boot animation on `/reception` | Done |
| Glitch-step animation on `/setup` | Done |

---

## 3. Target Users

**Primary:** Marketing professionals and content creators using Shadowfeed daily for post generation.

**Experience expectation:** Professional SaaS tool with clear hierarchy, fast interactions, and a distinctive identity. Not a generic dark-mode app — a branded, tense, purposeful tool.

---

## 4. Functional Requirements

### FR-001: Token System Refactor (globals.css)

Replace all current CSS tokens with the v2.0 Design System tokens:

**Surface hierarchy (5 levels — VSCode-inspired):**
```
--bg-void:     #060606   (deepest — outside viewport)
--bg-page:     #0d0d0d   (body/page)
--bg-sidebar:  #0a0a0a   (sidebar — slightly darker than page)
--bg-panel:    #111111   (editor equivalent)
--bg-surface:  #161616   (cards, containers)
--bg-elevated: #1c1c1c   (inputs, dropdowns, hover states)
--bg-overlay:  #242424   (floating menus, tooltips)
```

**Border tokens (solid, no rgba):**
```
--border-hairline: #161616   (barely visible dividers)
--border-subtle:   #1e1e1e   (default VSCode-style panel separators)
--border-default:  #2a2a2a   (cards, inputs at rest)
--border-strong:   #3a3a3a   (hover, neutral focus)
--border-accent:   #5c0099   (brand focus ring secondary)
--border-active:   #8a00c4   (active input, focused nav item)
```

**Text tokens:**
```
--text-primary:   #d4d4d4   (VSCode editor text — not pure white)
--text-secondary: #808080   (comments, metadata)
--text-muted:     #4a4a4a   (placeholders, disabled labels)
--text-disabled:  #2d2d2d   (disabled elements)
--text-accent:    #c084fc   (purple keywords, links)
--text-on-accent: #ffffff   (text on purple backgrounds)
```

**Brand tokens:**
```
--accent:        #8a00c4   (primary — from logo)
--accent-hover:  #9d00de   (+12% luminance)
--accent-active: #7000a8   (-12% luminance)
--accent-light:  #b44cff   (syntax highlight / keyword)
--accent-dim:    #1a0033   (brand badge background)
--accent-tint:   #120026   (focused input background)
--accent-glow:   rgba(138,0,196,0.25)   (ONLY for CTA button shadow)
```

**Status tokens:**
```
--status-ok:          #4ade80  / bg: #071a0f  / border: #1a4a1a
--status-warn:        #fbbf24  / bg: #1a1100  / border: #4a3000
--status-err:         #f87171  / bg: #1a0707  / border: #4a1a1a
--status-info:        #38bdf8
```

**Radius:**
```
--radius:    3px   (all standard elements)
--radius-xs: 2px   (micro badges only)
(avatars use rounded-full via dedicated class)
```

**Shadows:**
```
--shadow-sm:  0 1px 3px rgba(0,0,0,0.6)
--shadow-md:  0 4px 12px rgba(0,0,0,0.7)
--shadow-lg:  0 8px 24px rgba(0,0,0,0.85)
--shadow-cta: 0 0 20px var(--accent-glow)    (ONLY on Create Post CTA)
```

**Remove entirely:**
```
--glass-bg, --glass-blur, --overlay-hover
--shadow-card (replace with --shadow-sm)
--shadow-card-hover (replace with --shadow-md)
--shadow-button (replace with --shadow-sm)
--radius-sm: 8px, --radius-md: 12px, --radius-lg: 16px
```

---

### FR-002: Global Background Watermark

The logo must be permanently visible as a watermark behind all page content:

```css
body::after {
  content: '';
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 70vh;
  height: 70vh;
  background-image: url('/logo.png');
  background-size: contain;
  background-repeat: no-repeat;
  background-position: center;
  opacity: 0.05;
  z-index: 0;
  pointer-events: none;
}
```

All page content wrappers must have `position: relative; z-index: 1` (or higher) to render above the watermark.

**Note:** Remove all individual per-page logo watermark implementations — the global `body::after` replaces them all.

---

### FR-003: Scanlines Texture (Global)

A subtle CRT/terminal scanline texture applied globally:

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.04) 2px,
    rgba(0,0,0,0.04) 4px
  );
}
```

---

### FR-004: Component-Level Design Tokens Application

Every component in `web/src/components/` and every page in `web/src/app/` must be audited and updated to use the v2.0 tokens:

**Cards** — Replace:
- `bg-white/5` → `bg-[#161616]` (`--bg-surface`)
- `bg-white/10` → `bg-[#1c1c1c]` (`--bg-elevated`)
- `border-white/10` → `border-[#1e1e1e]` (`--border-subtle`)
- `backdrop-blur-*` → remove entirely
- `rounded-lg` / `rounded-xl` → `rounded-[3px]`

**Inputs** — Standard:
```
bg: #1c1c1c  border: #2a2a2a  focus-border: #8a00c4  focus-bg: #120026
placeholder: #4a4a4a  text: #d4d4d4  radius: 3px  height: 36px
```

**Buttons** — Standard:
```
Primary:   bg #8a00c4  hover #9d00de  active #7000a8  radius 3px
Secondary: bg #1c1c1c  border #2a2a2a  hover border #3a3a3a
Ghost:     bg transparent  border transparent  hover bg #1c1c1c
Danger:    bg #c41a3a  hover #d41f43
```

**Badges** — All must use `rounded-[3px]` (NOT `rounded-full`):
```
Neutral: bg #1c1c1c  border #2a2a2a  text #808080
Brand:   bg #1a0033  border #5c0099  text #b44cff
OK:      bg #071a0f  border #1a4a1a  text #4ade80
Warn:    bg #1a1100  border #4a3000  text #fbbf24
Err:     bg #1a0707  border #4a1a1a  text #f87171
Size:    11px font-semibold uppercase tracking-wider px-2 py-0.5
```

**Sidebar nav links:**
```
Default: text #808080  bg transparent  border-l-2 transparent
Hover:   text #d4d4d4  bg #1c1c1c
Active:  text #d4d4d4  bg #161616  border-l-2 #8a00c4
```

**Progress bars:**
```
Track: bg #1c1c1c  radius 0 (flat terminal line)  height: 3px
Fill:  bg #8a00c4  → warn: #fbbf24  → danger: #f87171
```

**Scrollbar:**
```
width: 4px  thumb: #2a2a2a  hover: #3a3a3a  radius: 0
```

---

### FR-005: Typography System

**Font hierarchy (finalized):**
```
DejaVu Sans Mono → ALL UI (already global — keep as-is)
Sora             → Page headings ONLY (h1, display text) via class
Rubik Glitch     → Glitch animations on /reception and /setup ONLY
```

**Remove from font loading** (unused in app UI):
- `Inter` — used only in `.design-slide` (keep for slides, but don't apply to UI)
- `Inter Tight` — verify if used anywhere; if not, remove from layout.tsx

**Type scale (CSS utility classes to add):**
```css
.sf-display { font-family: var(--font-sora); font-size: 48px; font-weight: 700; letter-spacing: -0.04em; }
.sf-h1      { font-family: var(--font-sora); font-size: 36px; font-weight: 600; letter-spacing: -0.03em; }
.sf-h2      { font-family: var(--font-sora); font-size: 26px; font-weight: 600; letter-spacing: -0.02em; }
.sf-label   { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: var(--text-secondary); }
.sf-label--prompt::before { content: '> '; color: var(--accent-light); }
```

---

### FR-006: Wizard Focused Layout (No Sidebar)

Routes `/setup` and `/create` (ex `/criar-post`) must render in a **focused layout** without the app sidebar:

- Full-width canvas (no left offset for sidebar)
- Only element in top-left: logo (small, links to `/`)
- Step indicator centered or top-right
- Primary content centered (max-width: 560px for forms)
- Background logo watermark persists (via `body::after`)

This requires a layout guard or a separate layout wrapper for these routes.

---

### FR-007: Setup Wizard — Reduce to 4 Steps

Current 7 steps → 4 steps:

| New Step | Content | Old Steps |
|----------|---------|-----------|
| 1 | Instagram display name + @username (two fields, one screen) | Steps 1+2 |
| 2 | Target audience + Main pain point (two textareas, one screen) | Steps 3+4 |
| 3 | Voice tone selection (emoji selector — unchanged) | Step 5 |
| 4 | About your business (textarea — unchanged) | Step 6 |

**Step 7 (highlight color)** is moved to `/account` settings page as a preference. It does not belong in onboarding — it's a preference, not a requirement to start using the product.

---

### FR-008: Route Renaming

| Current Route | New Route | Type | Notes |
|---------------|-----------|------|-------|
| `/criar-post` | `/create` | Rename | Portuguese → English |
| `/my-account` | `/account` | Rename | Shorter, cleaner |
| `/my-account/plan` | `/account/billing` | Rename | Clear intent: billing/usage |
| `/my-account/plans` | `/account/upgrade` | Rename | Clear intent: upgrade plan |
| `/manual` | Deprecated | Redirect | 301 → `/create` |

All internal navigation links, `useRouter().push()` calls, and `<Link href>` references must be updated.

---

### FR-009: Deprecate `/manual`

The `/manual` route uses a **light theme** (`bg-gray-50`) that breaks the dark design system entirely.

Actions:
1. Add a Next.js redirect in `next.config.*`: `/manual` → `/create` (301 permanent)
2. Keep the source file temporarily (as `_manual.tsx.bak` or delete after redirect confirmed)
3. Remove the `SetupRequiredGuard` wrapping (no longer needed once redirect exists)

---

### FR-010: Fix `/posts/[id]` Access Policy

Current state: `/` (home feed) shows all posts publicly. Clicking a post → `/posts/[id]` hits `AuthGuard` → redirect to login. This is a broken user experience for shared links.

**Decision:** Make `/posts/[id]` public (consistent with home feed).
- Remove `AuthGuard` from `/posts/[id]/page.tsx`
- Post content is already public (visible in the grid)
- If post privacy is needed in the future, implement at the data layer (RLS), not the route layer

---

## 5. Technical Architecture

### 5.1 File Impact Map

```
web/src/app/globals.css                     REWRITE (tokens v2.0)
web/src/app/layout.tsx                      MINOR (remove unused fonts)
web/src/components/Sidebar.tsx              REFACTOR (solid borders, new nav tokens)
web/src/components/PhotoCard.tsx            REFACTOR (radius 3px, solid bg)
web/src/app/page.tsx                        MINOR (ensure z-index above body::after)
web/src/app/reception/page.tsx              MAJOR (boot animation system)
web/src/app/login/page.tsx                  MINOR (token updates)
web/src/app/setup/page.tsx                  MAJOR (4 steps, focused layout, glitch anim)
web/src/app/criar-post/ → create/           RENAME + REFACTOR (focused layout)
web/src/app/my-posts/page.tsx               MINOR (token updates)
web/src/app/posts/[id]/page.tsx             MINOR (remove AuthGuard)
web/src/app/my-account/ → account/         RENAME
web/src/app/my-account/plan/ → billing/    RENAME
web/src/app/my-account/plans/ → upgrade/   RENAME
web/src/app/manual/page.tsx                 DEPRECATE (redirect)
```

### 5.2 CSS Architecture

```
globals.css
├── @import fonts (keep: DejaVu, Sora, DM Sans, Rubik Glitch | remove: Inter*)
├── @theme { --font-sans: DejaVu Sans Mono }
├── :root { /* Design Tokens v2.0 */ }
├── body::before { /* Scanlines */ }
├── body::after  { /* Logo watermark */ }
├── @keyframes { shimmer, fadeUp, pulse, cursor-blink, glitch-flicker,
│                boot-scanline, logo-glitch-in, step-slide-in, step-slide-out }
├── .shimmer-placeholder
├── .cursor-blink
├── .glitch-flicker
├── .boot-scanline
├── .logo-glitch-in
├── .step-enter
├── .step-exit
├── .sf-label / .sf-label--prompt
├── scrollbar styles
└── base styles (box-sizing, body, a, button)
```

### 5.3 Layout Architecture

Two layout modes:

**App Layout (default):** Sidebar (260px) + main content (with sidebar offset)

**Focused Layout (wizards):** No sidebar. Logo top-left. Step indicator. Content centered.

Implementation: Create `FocusedLayout.tsx` component used by `/setup` and `/create`.

---

## 6. Route & UX Improvements

### 6.1 Recommended Navigation Architecture

```
PUBLIC (unauthenticated):
  /               → Global feed (public posts visible)
  /posts/[id]     → Post detail (public — remove AuthGuard)
  /login          → Auth: sign in + sign up (unified)

ONBOARDING (authenticated, setup_completed = false):
  /setup          → Onboarding wizard (4 steps, focused layout)

APP (authenticated, setup_completed = true):
  /               → Global feed
  /create         → Post creation wizard (focused layout) [was /criar-post]
  /my-posts       → User posts gallery

ACCOUNT:
  /account        → Account dashboard [was /my-account]
  /account/billing   → Plan details + usage + analytics + cancel [was /my-account/plan]
  /account/upgrade   → Plans marketplace [was /my-account/plans]

ADMIN:
  /shadowfeedadmin   → Admin dashboard (keep name for security by obscurity)
```

### 6.2 `/reception` Simplification

The `/reception` route adds a redirect hop for returning users (home → reception → login).

**Recommendation:**
- Keep `/reception` for the boot animation experience — it IS valuable for first-time brand impression
- Add logic: if user was previously authenticated (check localStorage/cookie), redirect `/reception` → `/login` directly (skip animation for returning users)
- Add a "Skip" button after 1s for users who don't want to wait

---

## 7. Animation System

### 7.1 Global Animations (all pages)

| Name | Usage | Duration |
|------|-------|----------|
| `shimmer` | Loading placeholders | 1.5s loop |
| `fadeUp` | Form fields, staggered lists | 0.6s ease |
| `pulse` | Live status dots | 1.5s loop |
| `cursor-blink` | Input fields terminal cursor | 1.1s step-end |
| `glitch-flicker` | Logo hover state | 6s loop (subtle) |

### 7.2 `/reception` — Boot Sequence

**Sequence timeline:**
```
t=0ms:    Screen black (--bg-void)
t=100ms:  Scanline sweep: purple line travels top → bottom (1.2s)
t=800ms:  Logo glitch-in: ghost appears with glitch-scale-blur combo (1.4s)
t=1600ms: "shadowfeed" typewriter text (cursor blinking, Rubik Glitch font)
t=2400ms: Subtitle fade-in: "the new era of content"
t=2800ms: Buttons fade-up (stagger 150ms: Sign In, then Sign Up)
```

**Keyframes required:**
```css
@keyframes boot-scanline      { /* horizontal purple line sweep */ }
@keyframes logo-glitch-in     { /* scale + blur + translate glitch combo */ }
/* Typewriter: already exists — enhance with cursor-blink */
```

### 7.3 `/setup` — Terminal Form Transitions

**Step transitions:**
```css
@keyframes step-slide-in  { from: { opacity:0, translateX(24px), blur(4px) } }
@keyframes step-slide-out { to:   { opacity:0, translateX(-24px), blur(4px) } }
```

**Step progress indicator:** Flat terminal-style bar (3px height, 0 radius), fills from left. Color: `--accent` (`#8a00c4`).

**Labels:** All labels use `.sf-label--prompt` (with `>` prefix in purple).

**Submit completion:** On final step submit, brief glitch-flicker on the logo before redirect.

---

## 8. Acceptance Criteria by Epic

### Epic DS-01: Design Tokens Foundation

- [ ] `globals.css` fully refactored with v2.0 tokens
- [ ] All `rgba(255,255,255/*)` backgrounds replaced with solid equivalents
- [ ] All `backdrop-filter: blur` removed
- [ ] `--glass-bg`, `--glass-blur` removed
- [ ] `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px` replaced with `--radius: 3px`
- [ ] `body::after` watermark implemented (opacity 0.05, z-index 0)
- [ ] `body::before` scanlines implemented
- [ ] All animation keyframes defined (cursor-blink, glitch-flicker, boot-scanline, logo-glitch-in, step-slide-in, step-slide-out)
- [ ] Scrollbar updated (width 4px, solid colors, radius 0)

### Epic DS-02: Component Library Update

- [ ] `Sidebar.tsx` — solid bg `#0a0a0a`, border `#1e1e1e`, nav link active state with `border-l-2 #8a00c4`
- [ ] `PhotoCard.tsx` — `rounded-[3px]`, solid bg `#161616`, no glassmorphism
- [ ] All card components: solid `bg-[#161616]`, `border-[#1e1e1e]`, `rounded-[3px]`
- [ ] All input components: `bg-[#1c1c1c]`, `border-[#2a2a2a]`, `focus:border-[#8a00c4]`, `focus:bg-[#120026]`
- [ ] All button variants match token spec (Primary, Secondary, Ghost, Danger)
- [ ] All badges: `rounded-[3px]` (not `rounded-full`), correct color tokens
- [ ] Progress bars: flat (radius 0), 3px height, token-based fill colors
- [ ] Token usage display in sidebar: monospace numbers, correct status colors
- [ ] `CheckoutModal.tsx` — no glassmorphism, solid `bg-[#111111]`
- [ ] `PreviewModal.tsx` — no glassmorphism
- [ ] All guards (`AuthGuard`, `PublicOnlyGuard`, etc.) — ensure content is z-index ≥ 1

### Epic DS-03: Focused Layout for Wizards

- [ ] `FocusedLayout.tsx` component created
  - No sidebar
  - Logo top-left (48px, links to `/`)
  - Step indicator (flat progress bar, 3px)
  - Content area max-width 560px, centered
  - Full dark background (`--bg-page`)
  - Watermark still visible (via `body::after`)
- [ ] `/setup/page.tsx` uses `FocusedLayout`
- [ ] `/create/page.tsx` (ex `/criar-post`) uses `FocusedLayout`

### Epic DS-04: `/reception` Boot Animation

- [ ] Page opens with `--bg-void` (#060606)
- [ ] `boot-scanline` animation fires at t=100ms
- [ ] Logo `logo-glitch-in` fires at t=800ms
- [ ] Typewriter text "shadowfeed" appears at t=1600ms with `cursor-blink`
- [ ] Subtitle appears at t=2400ms (fadeUp)
- [ ] Buttons appear at t=2800ms (stagger 150ms)
- [ ] "Skip" button appears after t=1000ms (absolute top-right, ghost button)
- [ ] Returning user detection: if auth cookie/session exists, skip animation → `/login`

### Epic DS-05: `/setup` Wizard Refactor

- [ ] Wizard reduced from 7 to 4 steps
- [ ] Step 1: Display name + @username (single screen, two fields)
- [ ] Step 2: Target audience + Pain point (single screen, two textareas)
- [ ] Step 3: Voice tone (emoji selector — unchanged)
- [ ] Step 4: About your business (textarea — unchanged)
- [ ] Step 7 (highlight color) removed from onboarding — feature moved to `/account`
- [ ] All labels use `.sf-label--prompt` style (`> LABEL`)
- [ ] Step transitions use `step-slide-in` / `step-slide-out`
- [ ] Progress bar: flat 3px, purple fill, shows `n/4` steps
- [ ] On final step submit: `glitch-flicker` on logo for 600ms before redirect

### Epic DS-06: Route Renaming & Cleanup

- [ ] `/criar-post` → `/create` (directory rename + all references updated)
- [ ] `/my-account` → `/account` (directory rename + all references updated)
- [ ] `/my-account/plan` → `/account/billing` (rename + references)
- [ ] `/my-account/plans` → `/account/upgrade` (rename + references)
- [ ] `/manual` → 301 redirect to `/create` in `next.config.*`
- [ ] All `useRouter().push()` calls updated
- [ ] All `<Link href>` updated
- [ ] All `usePathname()` active link detection updated
- [ ] Sidebar nav links updated

### Epic DS-07: Access Policy Fixes

- [ ] `AuthGuard` removed from `/posts/[id]/page.tsx`
- [ ] `/posts/[id]` renders correctly for unauthenticated users (no user-specific data leaks)
- [ ] `/reception` has "Skip" button and returning user detection

### Epic DS-08: Page-by-Page Token Application

Each page audited and updated. Completion checklist:

- [ ] `/` (home feed) — content z-index ≥ 1, watermark visible, tokens applied
- [ ] `/login` — solid card, no blur, tokens
- [ ] `/reception` — boot animation (Epic DS-04)
- [ ] `/setup` — wizard refactor (Epic DS-05)
- [ ] `/create` (ex /criar-post) — focused layout, tokens
- [ ] `/my-posts` — tokens, generating card updated
- [ ] `/posts/[id]` — AuthGuard removed, tokens
- [ ] `/account` (ex /my-account) — tokens, profile section updated
- [ ] `/account/billing` — tokens, all 3 tabs updated, charts updated
- [ ] `/account/upgrade` — tokens, plan cards no glassmorphism
- [ ] `/shadowfeedadmin` — tokens applied to admin layout

---

## 9. Scope

### In Scope

- `globals.css` full refactor (tokens, animations, watermark, scanlines)
- All components in `web/src/components/`
- All pages in `web/src/app/`
- Route renaming (`/criar-post` → `/create`, `/my-account` → `/account`, etc.)
- `/manual` deprecation
- `/setup` wizard reduction (7 → 4 steps)
- Focused layout for wizard routes
- Boot animation for `/reception`
- Step animations for `/setup`
- `/posts/[id]` AuthGuard removal
- Sidebar token update

### Out of Scope

- Slide/post design system (`.design-slide` components — they have their own font isolation and are not UI)
- Backend changes
- Admin dashboard (`/shadowfeedadmin`) design overhaul — token updates only (functional priority)
- Dark/light theme toggle (product is always dark)
- Mobile responsive breakpoints (existing grid system maintained)
- New features (this is a design system migration, not feature development)
- Email/notification templates

---

## 10. Dependencies & Risks

### Dependencies

| Dependency | Required By | Notes |
|------------|-------------|-------|
| `globals.css` v2.0 tokens | All other epics | Must complete DS-01 first |
| `FocusedLayout.tsx` | DS-03 | Must exist before /setup and /create refactors |
| Route renames (DS-06) | All navigation updates | Rename first, then update references |
| `/manual` deprecation | DS-06 | Can redirect before page is deleted |

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| CSS token cascade breaks slide designs | Medium | High | `.design-slide` isolation already in place (`font-family: inherit`). Test each slide theme after DS-01. |
| Route rename breaks existing Supabase deep links | Low | Medium | Add redirects before renaming. Run search for all hardcoded URLs. |
| `body::after` watermark bleeds into post screenshots | Low | High | Post screenshot capture uses `html2canvas` / puppeteer which won't capture `::before/::after` pseudo-elements on `body`. Verify. |
| Animation timing causes CLS (Cumulative Layout Shift) | Low | Medium | Use `position: fixed` for boot elements, not layout-affecting ones. |
| `AuthGuard` removal on `/posts/[id]` exposes private data | Medium | High | Audit what data is fetched server-side vs client-side. Ensure `actions.ts` server action is safe for public access. |

---

## 11. Epic Breakdown

Recommended execution order (wave-based):

### Wave 1 — Foundation (blocks everything else)
- **DS-01:** Design Tokens Foundation (`globals.css`)

### Wave 2 — Layout & Structure (parallel)
- **DS-03:** Focused Layout (`FocusedLayout.tsx`)
- **DS-06:** Route Renaming & Cleanup

### Wave 3 — Component Library (parallel, after Wave 1)
- **DS-02:** Component Library Update (all components)

### Wave 4 — Pages (parallel, after Wave 2+3)
- **DS-04:** `/reception` Boot Animation
- **DS-05:** `/setup` Wizard Refactor
- **DS-07:** Access Policy Fixes
- **DS-08:** Page-by-Page Token Application

---

## Appendix A — Token Migration Cheatsheet

Quick reference for developers during implementation:

| Old (remove) | New (use) |
|---|---|
| `bg-white/5` | `bg-[#161616]` |
| `bg-white/10` | `bg-[#1c1c1c]` |
| `bg-black/50` | `bg-[#0d0d0d]` |
| `border-white/5` | `border-[#161616]` |
| `border-white/10` | `border-[#1e1e1e]` |
| `border-white/20` | `border-[#2a2a2a]` |
| `backdrop-blur-*` | (remove) |
| `rounded-lg` | `rounded-[3px]` |
| `rounded-xl` | `rounded-[3px]` |
| `rounded-2xl` | `rounded-[3px]` |
| `rounded-full` (UI) | `rounded-[3px]` |
| `rounded-full` (avatars) | `rounded-full` (keep) |
| `text-white/65` | `text-[#808080]` |
| `text-white/40` | `text-[#4a4a4a]` |
| `shadow-[0_0_30px_rgba(138,0,196,0.15)]` | `shadow-sm` |

---

## Appendix B — Component Audit Checklist

Use during DS-02 and DS-08:

```
□ No backdrop-filter / backdrop-blur
□ No bg-white/* or bg-black/* with opacity
□ No border-white/* or border-black/* with opacity
□ All border-radius is 3px (except avatars = rounded-full)
□ Buttons match spec (Primary/Secondary/Ghost/Danger)
□ Badges are rounded-[3px], not rounded-full
□ Progress bars: height 3px, radius 0
□ Content wrapper: z-index ≥ 1 (to appear above body::after watermark)
□ Tokens reference CSS variables, not hardcoded hex
```

---

*— Morgan, planejando o futuro 📊*
*Last Updated: 2026-02-18 | ShadowFeed Product Team*
