# Epic DS-TERMINAL — Design System v2.0
## Terminal · VSCode · Hack aesthetic for Shadowfeed

**PRD:** `docs/prd/prd-design-system-v2.md`
**Status:** Ready for development
**Created:** 2026-02-18

---

## Execution Order (Wave-based)

```
WAVE 1 — Foundation (must complete first, blocks everything)
└── 1.1  Design Tokens Foundation       [globals.css rewrite]

WAVE 2 — Structure (parallel, after Wave 1)
├── 1.3  Focused Wizard Layout          [FocusedLayout.tsx]
└── 1.6  Route Renaming & Cleanup       [renames + /manual deprecation]

WAVE 3 — Components (parallel, after Wave 1)
└── 1.2  Component Library Update       [all shared components]

WAVE 4 — Pages (parallel, after Waves 2+3)
├── 1.4  Reception Boot Animation       [/reception glitch sequence]
├── 1.5  Setup Wizard Refactor          [7→4 steps, terminal labels]
├── 1.7  Access Policy Fixes            [/posts/[id] public]
└── 1.8  Page-by-Page Token Sweep       [all remaining pages]
```

---

## Stories

| ID | Story | Wave | Size | Status |
|----|-------|------|------|--------|
| [1.1](./1.1-design-tokens-foundation.story.md) | Design Tokens Foundation | 1 | M | Ready |
| [1.2](./1.2-component-library-update.story.md) | Component Library Update | 3 | L | Ready |
| [1.3](./1.3-focused-wizard-layout.story.md) | Focused Wizard Layout | 2 | S | Ready |
| [1.4](./1.4-reception-boot-animation.story.md) | Reception Boot Animation | 4 | M | Ready |
| [1.5](./1.5-setup-wizard-refactor.story.md) | Setup Wizard Refactor | 4 | L | Ready |
| [1.6](./1.6-route-renaming-cleanup.story.md) | Route Renaming & Cleanup | 2 | M | Ready |
| [1.7](./1.7-access-policy-fixes.story.md) | Access Policy Fixes | 4 | S | Ready |
| [1.8](./1.8-page-token-sweep.story.md) | Page-by-Page Token Sweep | 4 | L | Ready |

---

## Key Design Decisions

| Decision | Value |
|----------|-------|
| Border radius | `3px` everywhere (avatars: `50%`) |
| Primary bg | `#0d0d0d` |
| Surface | `#161616` |
| Elevated | `#1c1c1c` |
| Accent | `#8a00c4` |
| Text primary | `#d4d4d4` (VSCode editor text) |
| Text secondary | `#808080` |
| Global font | DejaVu Sans Mono |
| Heading font | Sora (display/h1/h2 only) |
| Glassmorphism | Prohibited |
| Watermark | `body::after` — 5% opacity, fixed center |
| Scanlines | `body::before` — 4px repeating gradient |
| Modal z-index | `10000+` (above scanlines at 9999) |

---

## Token Migration Reference

| Old | New |
|-----|-----|
| `bg-white/5` | `bg-[#161616]` |
| `bg-white/10` | `bg-[#1c1c1c]` |
| `border-white/10` | `border-[#1e1e1e]` |
| `backdrop-blur-*` | remove |
| `rounded-lg` | `rounded-[3px]` |
| `text-white/65` | `text-[#808080]` |
| `text-white/40` | `text-[#4a4a4a]` |

---

*Epic created by @sm (River) · Research by @analyst (Atlas) · PRD by @pm (Morgan)*
