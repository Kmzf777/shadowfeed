# Epic: RECON-ULTRA — Profile-Aware Intelligence Engine

> **PRD:** `docs/prd/prd-recon-ultra.md`
> **Created:** 2026-03-04
> **Author:** @sm (River) from @pm (Morgan) epic plan

---

## Overview

Replace the hardcoded, AI-only Recon system with a profile-aware, pillar-driven intelligence engine that generates queries from user profiles, scrapes blogs with Playwright, and integrates with Forge-Smart via a cache layer.

## Wave Structure

| Wave | Epic | Stories | Priority |
|------|------|---------|----------|
| 1 | **Epic 1 — Recon Ultra Core** | 1.1–1.5 | P0 |
| 2 | **Epic 2 — Dynamic Sources** | 2.1–2.4 | P0 |
| 2 | **Epic 3 — Blog Scraper** | 3.1–3.3 | P1 |
| 3 | **Epic 4 — Forge-Smart Integration** | 4.1 | P1 |
| 4 | **Epic 5 — Pillar Scoring Upgrade** | 5.1 | P2 |

## Stories

| Story | Title | Status | Epic |
|-------|-------|--------|------|
| 1.1 | DB Migrations & Schema | Ready | Core |
| 1.2 | Module Scaffold & Types | Ready | Core |
| 1.3 | Profile-Aware Query Builder | Ready | Core |
| 1.4 | Profile Scorer (TF-IDF) | Ready | Core |
| 1.5 | Pipeline Service & Controller | Ready | Core |
| 2.1 | Google News Dynamic Source | Ready | Dynamic Sources |
| 2.2 | Google Trends Dynamic Source | Ready | Dynamic Sources |
| 2.3 | Reddit Dynamic Source | Ready | Dynamic Sources |
| 2.4 | Twitter Dynamic Source | Ready | Dynamic Sources |
| 3.1 | Blog Source CRUD & DB | Ready | Blog Scraper |
| 3.2 | Playwright Blog Scraper Engine | Ready | Blog Scraper |
| 3.3 | Blog Discovery Suggestions | Ready | Blog Scraper |
| 4.1 | Forge-Smart Cache Integration | Ready | Forge-Smart Integration |
| 5.1 | Gemini Pillar Tagger & Alignment Score | Ready | Pillar Scoring |

## Dependencies

```
1.1 → 1.2 → 1.3, 1.4 → 1.5
1.5 → 2.1, 2.2, 2.3, 2.4 (parallel)
1.1 → 3.1 → 3.2 → 3.3
1.5 + 2.* → 4.1
1.5 → 5.1
```
