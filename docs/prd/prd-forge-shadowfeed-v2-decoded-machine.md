# FORGE SHADOWFEED v2 — DECODED CONTENT MACHINE — PRD

> **Feature Codename:** FS-DECODED — Forge ShadowFeed Decoded Content Machine
> **Type:** Backend overhaul + content strategy engine (brownfield)
> **Status:** Finalized — Ready for Epic & Story Creation
> **Author:** @pm (Morgan) · Research by @analyst (Atlas)
> **Date:** 2026-02-25
> **Source of Truth:** `/pesquisabrandsdecoded.md` (Brand Spy Report — @brandsdecoded__)
> **Document optimized for execution via Claude Code.**

---

## Table of Contents

1. [Background & Diagnosis](#1-background--diagnosis)
2. [Goals & Success Metrics](#2-goals--success-metrics)
3. [Target Users](#3-target-users)
4. [Strategy Traceability Matrix](#4-strategy-traceability-matrix)
5. [Functional Requirements](#5-functional-requirements)
6. [Technical Architecture](#6-technical-architecture)
7. [Discovery Engine v2](#7-discovery-engine-v2)
8. [Content Strategy Engine](#8-content-strategy-engine)
9. [Schema & Data Model](#9-schema--data-model)
10. [API Endpoints](#10-api-endpoints)
11. [Acceptance Criteria by Epic](#11-acceptance-criteria-by-epic)
12. [Scope](#12-scope)
13. [Dependencies & Risks](#13-dependencies--risks)
14. [Epic Breakdown](#14-epic-breakdown)
15. [Verification Plan](#15-verification-plan)

---

## 1. Background & Diagnosis

### 1.1 The BrandsDecoded Benchmark

The @brandsdecoded__ account (261K followers, 1,061 posts, R$1.5M+ revenue via Instagram) operates as a **self-selling content machine**: every free post simultaneously delivers value AND seeds the product. This strategy is documented in `/pesquisabrandsdecoded.md`.

The ShadowFeed Instagram account (@shadowfeed.ai) must replicate this exact strategy to sell the ShadowFeed product. The forge-shadowfeed module is the engine that generates this content automatically.

### 1.2 Current State (forge-shadowfeed v1)

The current system has critical gaps when compared to the BrandsDecoded strategy:

| Aspect | BrandsDecoded (Research §) | Current ShadowFeed v1 | Gap |
|---|---|---|---|
| **Pillars** | 5 pillars with exact proportions (§05) | 4 pillars with wrong proportions | Missing `brand-breakdown` (20%), wrong ratios |
| **Hook System** | 6 identified archetypes (§06) | No hook archetype system | LLM generates random hooks, no scroll-stop structure |
| **Slide Anatomy** | 7-zone carousel structure (§03) | Generic slide roles (hook/content/cta) | Missing context, tension, soft-cta zones |
| **Copy Phases** | 3-phase copy progression per carousel (§07) | No copy phase awareness | LLM doesn't differentiate interruption/value/conversion |
| **Conversion Pyramid** | 70/20/10 funnel in feed (§08) | No funnel awareness | All posts generated equally, no strategic distribution |
| **Double Door** | Every free post seeds the product (§08) | Product mention only in `the-offer` pillar | 90% of posts have zero product seeding |
| **Weekly Cadence** | Day-specific content types (§09) | Same 4 pillars every day | No day-of-week intelligence |
| **Discovery Depth** | Posts based on real data and analysis (§07) | Discovery winner → title only (no body scrape) | LLM invents content instead of using real data |
| **Slide Density** | 3-5 (provocative) vs 8-12 (educational) (§04) | Fixed ranges per pillar | No content-type-aware density logic |
| **CTA Strategy** | Contextual CTAs per pillar type (§07) | Generic CTAs | CTAs don't match engagement objective |

### 1.3 Why This Matters

The BrandsDecoded formula works because of **three interconnected systems**:

1. **Content is the product demo** (Research §01 — "Cada post é simultaneamente conteúdo e vitrine do método")
2. **Consistency proves the system** (Research §11 — "1.061 posts publicados. A máquina não para.")
3. **Free value builds trust before any sale** (Research §08 — "A audiência aprende a confiar ANTES de qualquer oferta")

Without implementing ALL three, the strategy fails. A partial implementation produces generic content that neither builds authority nor converts.

---

## 2. Goals & Success Metrics

### 2.1 Goals

| # | Goal | Traced to Research § |
|---|---|---|
| G1 | Generate content that follows the 5-pillar structure with exact proportions | §05 |
| G2 | Every post uses one of the 6 hook archetypes for maximum scroll-stop | §06 |
| G3 | 70% of posts deliver free value, 20% show proof, 10% sell directly | §08 Pyramid |
| G4 | Every free post naturally seeds the ShadowFeed product (double door) | §08 Double Door |
| G5 | Discovery engine provides REAL data (scraped articles, not just titles) | §07 Copy Phases |
| G6 | Weekly cadence matches BrandsDecoded distribution pattern | §09 Calendar |
| G7 | Slide structure follows the 7-zone anatomy for each pillar type | §03, §10 |

### 2.2 Success Metrics

| Metric | Target | Measurement |
|---|---|---|
| Pillar distribution accuracy | Within ±5% of 30/25/20/15/10 over 30 days | SQL query on `sf_shadowfeed_queue` |
| Hook archetype coverage | All 6 archetypes used within any 14-day window | Track `hook_archetype` column |
| Discovery body scrape rate | >70% of discovery winners have scraped_body >200 chars | Track in queue metadata |
| Double door seed presence | >90% of non-offer posts contain product seed | Audit generated captions |
| Content depth (data points) | Avg >3 data points per educational/case-study post | Track via ResearchDigest |
| Weekly cadence compliance | >80% of posts match day-of-week pillar plan | Compare queue vs cadence |

---

## 3. Target Users

- **Primary:** ShadowFeed admin team (content approval dashboard)
- **Secondary:** ShadowFeed Instagram followers (consume generated content)
- **Tertiary:** Potential ShadowFeed customers (converted via double-door seeding)

---

## 4. Strategy Traceability Matrix

> **CRITICAL:** Every functional requirement MUST trace to a specific section of `/pesquisabrandsdecoded.md`. If it cannot be traced, it does not belong in this PRD.

### 4.1 Pillar System Traceability

| Research § | Research Finding | Implementation Requirement | FR ID |
|---|---|---|---|
| §05, Row 1 | INFORMATIVO EDUCATIVO (~30%) — valor técnico, autoridade + salvamentos | New pillar `educational-value` at 30% frequency, 8-12 slides, discoveryRatio 0.7 | FR-PIL-01 |
| §05, Row 2 | PROVOCATIVO / POLARIZANTE (~25%) — contra-narrativa, comentários + compartilhamentos | Rename `wake-up-slap` behavior to match, 4-6 slides, discoveryRatio 0.3 | FR-PIL-02 |
| §05, Row 3 | ANÁLISE DE MARCA / CASE STUDY (~20%) — breakdown de marcas reais | New pillar `brand-breakdown`, 10-14 slides, discoveryRatio 0.9 | FR-PIL-03 |
| §05, Row 4 | BASTIDORES / PROVA SOCIAL (~15%) — resultados, processo de criação | New pillar `proof-social`, 6-8 slides, discoveryRatio 0.2 | FR-PIL-04 |
| §05, Row 5 | OFERTA DIRETA / LANÇAMENTO (~10%) — venda direta | Refine `the-offer`, 8-10 slides, discoveryRatio 0.0 | FR-PIL-05 |

### 4.2 Hook System Traceability

| Research § | Research Finding | Implementation Requirement | FR ID |
|---|---|---|---|
| §06, Archetype 1 | CONTROVÉRSIA DIRETA — "[Fato contraintuitivo] que [grupo] não quer que você saiba" | `direct-controversy` hook archetype with structure template | FR-HOOK-01 |
| §06, Archetype 2 | NÚMERO ESPECÍFICO — "[X] coisas que [consequência negativa]" | `specific-number` archetype, weight 0.25 (most frequent) | FR-HOOK-02 |
| §06, Archetype 3 | PROMESSA TRANSFORMADORA — "Como [pessoa] fez [resultado impossível] em [tempo curto]" | `transformative-promise` archetype | FR-HOOK-03 |
| §06, Archetype 4 | POLARIZAÇÃO — "[Declaração que divide opiniões]" | `polarization` archetype | FR-HOOK-04 |
| §06, Archetype 5 | CURIOSIDADE / MISTÉRIO — "O motivo real pelo qual [X] não funciona" | `curiosity-mystery` archetype | FR-HOOK-05 |
| §06, Archetype 6 | COMPARAÇÃO / ROAST — "[Marca A] vs [Marca B]" | `brand-comparison` archetype | FR-HOOK-06 |
| §06, Pattern | "NUNCA pergunta no cover. O cover AFIRMA." | Prompt rule: hook slide must be declarative, never interrogative | FR-HOOK-07 |
| §06, Pattern | Uso do `//` como assinatura visual | Include `//` prefix option in hook generation | FR-HOOK-08 |

### 4.3 Carousel Structure Traceability

| Research § | Research Finding | Implementation Requirement | FR ID |
|---|---|---|---|
| §03, Slide 1 | HOOK — "Promessa brutal. Tipografia enorme. Sem contexto — só tensão." | First slide: role=`hook`, max 15 words, no explanation | FR-STRUCT-01 |
| §03, Slides 2-3 | CONTEXTO/PROBLEMA — "Apresenta o problema. Cria identificação com a dor." | New role `context` for slides 2-3 | FR-STRUCT-02 |
| §03, Slides 4-7 | DESENVOLVIMENTO/VALOR — "1 ideia por slide. Título + 2-4 linhas." | Role `content` with enforced density rule: 1 idea per slide | FR-STRUCT-03 |
| §03, Antepenúltimo | TENSÃO FINAL — "Pergunta retórica, afirmação polarizante, insight-bomba" | New role `tension` for antepenultimate slide | FR-STRUCT-04 |
| §03, Penúltimo | CTA SUAVE — "Salva / Compartilha — contextualizado, nunca genérico" | New role `soft-cta` with pillar-specific CTA text | FR-STRUCT-05 |
| §03, Último | CTA DE OFERTA OU BRANDING | Role `cta` with double-door seed injection | FR-STRUCT-06 |
| §04, 3-5 slides | Posts provocativos: curtos, para compartilhamento/comentários | `wake-up-slap` pillar: min 4, max 6 slides | FR-STRUCT-07 |
| §04, 8-12 slides | Posts educativos: densos, para salvamentos/autoridade | `educational-value` pillar: min 8, max 12 slides | FR-STRUCT-08 |
| §04, Insight | "Posts 7-12 slides: equilíbrio entre profundidade e retenção é máximo" | Default range 7-12 for main pillar (educational) | FR-STRUCT-09 |

### 4.4 Copy Strategy Traceability

| Research § | Research Finding | Implementation Requirement | FR ID |
|---|---|---|---|
| §07, Phase 1 | INTERRUPÇÃO (Slides 1-2) — "Zero explicação, só tensão" | Prompt block: first 2 slides use interruption copy rules | FR-COPY-01 |
| §07, Phase 2 | DESENVOLVIMENTO (Slides 3-7) — "título + 2-4 linhas, linguagem direta" | Prompt block: value slides use development copy rules | FR-COPY-02 |
| §07, Phase 2 | "Sempre frase de transição no rodapé: '→ Mais no próximo'" | Prompt rule: transition phrases between content slides | FR-COPY-03 |
| §07, Phase 3 | CONVERSÃO (Slides Finais) — CTAs contextualizados por tipo de post | CTA selection based on pillar engagement objective | FR-COPY-04 |
| §07, CTA table | "Salva esse post" for informativos, "Comenta X" for polarizantes, etc. | CTA mapping: pillar → engagement_objective → cta_template | FR-COPY-05 |
| §11, Diferencial 4 | "Copy sem eufemismos. Direto. Às vezes brutal. Nunca genérico." | Persona rule: direct language, no hedging, no corporate tone | FR-COPY-06 |

### 4.5 Conversion Pyramid Traceability

| Research § | Research Finding | Implementation Requirement | FR ID |
|---|---|---|---|
| §08, Pyramid Top | 70% CONTEÚDO GRATUITO — "Não vendem nada. Constroem autoridade." | educational + wake-up + brand-breakdown = 75% (close to 70%) | FR-FUNNEL-01 |
| §08, Pyramid Mid | 20% PROVA SOCIAL — "Oferta aparece de forma indireta" | proof-social = 15% + double-door seeds in top = ~20% effective | FR-FUNNEL-02 |
| §08, Pyramid Base | 10% OFERTA DIRETA — "Sempre contextualizados com resultado" | the-offer = 10%, with price anchoring + social proof slides | FR-FUNNEL-03 |
| §08, Double Door | "Mesmo post que entrega valor contém a semente da oferta" | Double-door system: maps each pillar content → product seed | FR-FUNNEL-04 |
| §08, Double Door table | 5 specific content→seed mappings | Implement all 5 mappings as `DoubleDoorSeed` rules | FR-FUNNEL-05 |
| §08, Anchoring | "Ancoragem: Combo 8 produtos R$297 vs valor real R$800+" | Offer pillar templates include price anchoring structure | FR-FUNNEL-06 |
| §08, Anchoring | "Prova social integrada no slide de oferta: 15.000 clientes" | Offer pillar must include social proof data in offer slide | FR-FUNNEL-07 |

### 4.6 Weekly Cadence Traceability

| Research § | Research Finding | Implementation Requirement | FR ID |
|---|---|---|---|
| §09, Cadence | "5-7 posts por semana" | Generate 7 posts/week (1/day) as default batch cadence | FR-CAD-01 |
| §09, Mon/Tue | "Post Educativo Pesado (8-12 slides) — audiência em modo de aprendizado" | Mon+Tue → `educational-value` pillar | FR-CAD-02 |
| §09, Wed/Thu | "Post Provocativo ou Análise de Marca — pico de engajamento" | Wed → `wake-up-slap`, Thu → `brand-breakdown` | FR-CAD-03 |
| §09, Fri | "Post de Prova Social — preparação para venda do fim de semana" | Fri → `proof-social` pillar | FR-CAD-04 |
| §09, Weekend | "Oferta Direta OU post de valor leve (3-5 slides)" | Sat → `the-offer`, Sun → `educational-value` (light) | FR-CAD-05 |

### 4.7 Discovery & Research Traceability

| Research § | Research Finding | Implementation Requirement | FR ID |
|---|---|---|---|
| §07, Phase 2 | "Cada ponto tem título em destaque. Uso de analogias do mundo real." | Discovery must provide REAL data for LLM to reference, not invent | FR-DISC-01 |
| §05, Pillar 3 | "Breakdown de estratégia de marcas reais: Apple, Nubank, StartSe" | Discovery must fetch actual brand strategy articles | FR-DISC-02 |
| §05, Pillar 1 | "7 erros que destroem o alcance" — requires data backing | Discovery must scrape article body (not just title) for data extraction | FR-DISC-03 |
| §11, Diferencial 6 | "IA como assinatura, não atalho" | LLM uses real data from discovery, never fabricates statistics | FR-DISC-04 |
| §08, Pillar 4 | "Resultados de alunos, processo de criação" | Discovery must search for social proof content (user results, testimonials) | FR-DISC-05 |

---

## 5. Functional Requirements

### FR-PIL: Pillar System (5 Pillars)

#### FR-PIL-01: Educational Value Pillar
- **Traces to:** Research §05 Pillar #1
- **PillarId:** `educational-value`
- **Proportion:** 30% of weekly posts
- **Slides:** 8-12
- **Discovery ratio:** 0.7
- **Content type:** Technical value, tutorials, data breakdowns
- **Engagement objective:** Saves + authority
- **Posting time:** 09:00
- **Structure (from §10):** Hook → Problem → 5-7 value points → CTA save

#### FR-PIL-02: Wake-Up Slap Pillar
- **Traces to:** Research §05 Pillar #2
- **PillarId:** `wake-up-slap`
- **Proportion:** 25% of weekly posts
- **Slides:** 4-6
- **Discovery ratio:** 0.3
- **Content type:** Counter-narrative, strong statements, controversy
- **Engagement objective:** Comments + shares + reach
- **Posting time:** 11:00
- **Structure (from §10):** Hook → 2-3 arguments → Twist/provocation → CTA comment

#### FR-PIL-03: Brand Breakdown Pillar
- **Traces to:** Research §05 Pillar #3
- **PillarId:** `brand-breakdown`
- **Proportion:** 20% of weekly posts
- **Slides:** 10-14
- **Discovery ratio:** 0.9
- **Content type:** Real brand strategy analysis, case studies
- **Engagement objective:** Saves + authority + reputation
- **Posting time:** 14:00
- **Structure (from §10):** Hook → Brand context → 6-8 analysis points → Lesson → CTA

#### FR-PIL-04: Proof Social Pillar
- **Traces to:** Research §05 Pillar #4
- **PillarId:** `proof-social`
- **Proportion:** 15% of weekly posts
- **Slides:** 6-8
- **Discovery ratio:** 0.2
- **Content type:** Results, before/after, behind-the-scenes
- **Engagement objective:** Trust + indirect conversion
- **Posting time:** 17:00
- **Structure (from §10):** Hook → Context → Before → Transformation → Proof → Soft offer

#### FR-PIL-05: The Offer Pillar
- **Traces to:** Research §05 Pillar #5
- **PillarId:** `the-offer`
- **Proportion:** 10% of weekly posts
- **Slides:** 8-10
- **Discovery ratio:** 0.0 (100% template)
- **Content type:** Direct sale with anchoring, social proof, guarantee
- **Engagement objective:** Conversion / sales
- **Posting time:** 20:00
- **Structure (from §10):** Hook result → Problem → Solution → Social proof → Offer+anchoring → Guarantee → CTA direct

---

### FR-HOOK: Hook Archetype System

#### FR-HOOK-01 through FR-HOOK-06: Six Archetypes
Implement the 6 hook archetypes from Research §06 with:
- Weighted random selection (no archetype repeats within 2 consecutive posts)
- Pillar affinity (each archetype has `bestForPillars` list)
- Structure templates with variable slots
- 3 concrete examples per archetype

#### FR-HOOK-07: Declarative Hook Rule
- Hook slide 1 MUST be a statement, NEVER a question
- Prompt enforcement: "O cover AFIRMA. A interrogação aparece nos slides intermediários."
- Source: Research §06 pattern note

#### FR-HOOK-08: `//` Visual Signature
- Optional `//` prefix before hook text as brand identity marker
- Applied in ~30% of hooks (configurable)
- Source: Research §06 — "uso do `//` antes do texto principal"

---

### FR-STRUCT: Carousel Structure

#### FR-STRUCT-01 through FR-STRUCT-06: 7-Zone Anatomy
Implement the carousel anatomy from Research §03:

| Zone | Role Name | Prompt Rule | Source |
|---|---|---|---|
| Slide 1 | `hook` | Max 15 words. Declarative. No context. Pure tension. | §03 Slide 1 |
| Slides 2-3 | `context` | Present problem. Create identification with audience pain. | §03 Slides 2-3 |
| Slides 4-N | `content` | ONE idea per slide. Title + 2-4 lines. Bold key terms. | §03 Slides 4-7 |
| Antepenultimate | `tension` | Final provocation. Rhetorical question OR polarizing statement OR insight-bomb. | §03 Antepenúltimo |
| Penultimate | `soft-cta` | Contextual save/share CTA. NEVER generic. | §03 Penúltimo |
| Last | `cta` | Product offer OR branding. Double-door seed injection. | §03 Último |

#### FR-STRUCT-07 through FR-STRUCT-09: Slide Density Logic
- Provocative posts (wake-up-slap): 4-6 slides (Source: §04 "Posts de 3-5 slides")
- Educational posts: 8-12 slides (Source: §04 "Posts de 8-12 slides")
- Maximum 14 slides (Source: §04 "Posts muito longos sacrificam taxa de completion")

---

### FR-COPY: Copy Phase System

#### FR-COPY-01: Interruption Phase (Slides 1-2)
- Zero explanation, only tension
- Techniques: numeric shock, polarizing statement, taboo word, identity denial
- Source: Research §07 Phase 1

#### FR-COPY-02: Development Phase (Slides 3-N)
- Dense, informative, structured copy
- Each slide: title + 2-4 lines of text
- Direct language: "Faz isso." NOT "Você deve considerar fazer isso."
- Source: Research §07 Phase 2

#### FR-COPY-03: Transition Phrases
- Footer transition between content slides: "→ Mais no próximo"
- Source: Research §07 Phase 2

#### FR-COPY-04 & FR-COPY-05: Contextual CTAs
Map from Research §07 Phase 3:

| Pillar | CTA Text | Source |
|---|---|---|
| educational-value | "Salva esse post, você vai precisar" | §07 CTA table row 1 |
| wake-up-slap | "Comenta [X] se você concorda" | §07 CTA table row 2 |
| brand-breakdown | "Marca um amigo que precisa ver isso" | §07 CTA table row 3 |
| proof-social | "Link na bio para [produto]" | §07 CTA table row 4 |
| the-offer | "Link na bio — [plano] por [preço]" | §07 CTA table row 4 |

#### FR-COPY-06: No-Euphemism Rule
- Persona: direct, sometimes brutal, never generic
- Anti-patterns: no hedging ("talvez", "pode ser"), no corporate tone ("jornada", "propósito"), no guru-speak ("segredo que ninguém conta")
- Source: Research §11 Diferencial 4

---

### FR-FUNNEL: Conversion Pyramid

#### FR-FUNNEL-01 through FR-FUNNEL-03: 70/20/10 Distribution
Track `funnel_tier` on every generated post:
- `top` (70%): educational-value + wake-up-slap + brand-breakdown
- `middle` (20%): proof-social
- `bottom` (10%): the-offer
- Source: Research §08 Pyramid

#### FR-FUNNEL-04 & FR-FUNNEL-05: Double Door System
Every non-offer post must contain a product seed. Mapping from Research §08 Double Door table:

| Free Content Theme | Product Seed | Placement | Intensity |
|---|---|---|---|
| Carousel structure / copy | "O ShadowFeed já tem essa estrutura embutida." | caption | whisper |
| Algorithm / consistency | "Manter consistência é fácil quando a máquina nunca para." | caption | mention |
| Brand strategy analysis | "Essa estratégia inteira pode ser replicada com ShadowFeed." | caption | whisper |
| User results | "Quer o mesmo resultado? Comece grátis — 160 tokens na casa." | last slide | spotlight |
| Agency/freelancer cost | "R$40/mês vs R$3.000/mês. A matemática não mente." | penultimate | spotlight |

Seed intensity levels:
- **whisper**: Subtle mention in caption only (top-of-funnel posts)
- **mention**: Named reference in caption + penultimate slide (middle-of-funnel)
- **spotlight**: Explicit product mention with pricing (bottom-of-funnel)

#### FR-FUNNEL-06 & FR-FUNNEL-07: Offer Anchoring
Offer pillar templates MUST include (Source: Research §08 Anchoring):
- Price anchoring: individual plan vs combo value
- Social proof in offer slide: "X clientes já usam" (use real number from DB if available)
- Explicit guarantee: "7 dias incondicional"
- Installment highlight: monthly price breakdown

---

### FR-CAD: Weekly Cadence

#### FR-CAD-01 through FR-CAD-05: Day-of-Week Calendar
From Research §09:

| Day | Primary Pillar | Funnel Tier | Reasoning (from §09) |
|---|---|---|---|
| Monday | `educational-value` | top | "Início de semana captura audiência em modo de aprendizado" |
| Tuesday | `educational-value` | top | Reinforces Monday learning mode |
| Wednesday | `wake-up-slap` | top | "Pico de engajamento de semana" |
| Thursday | `brand-breakdown` | top | Peak engagement, analytical content |
| Friday | `proof-social` | middle | "Preparação psicológica para a venda do fim de semana" |
| Saturday | `the-offer` | bottom | Weekend conversion window |
| Sunday | `educational-value` (light, 4-6 slides) | top | Light value OR rest day |

---

### FR-DISC: Discovery Engine v2

#### FR-DISC-01: Real Data Requirement
- Discovery pipeline MUST scrape winner article body (min 200 chars, target 4000 chars)
- Reuse existing `scrapeBlogUrl()` from `src/modules/manual-news/url-scraper.ts`
- This is the critical missing step: forge-smart has it (`smart-winner-scraper.ts`), forge-shadowfeed does not
- Source: Research §07 — "cada ponto tem título em destaque, uso de analogias do mundo real"

#### FR-DISC-02: Brand Strategy Discovery
- `brand-breakdown` pillar queries MUST target actual brand analysis articles
- Include both PT-BR and EN queries (global brands)
- Source: Research §05 Pillar 3 — "Apple, Nubank, StartSe"

#### FR-DISC-03: Article Body Scraping
- 6-stage pipeline: Query → Fetch → Score → **Scrape** → **Summarize** → Cache
- Scrape adds Puppeteer-based body extraction (same as forge-smart)
- Summarize adds LLM-powered data extraction (new for ShadowFeed)
- Source: Structural requirement to support FR-DISC-01

#### FR-DISC-04: No Fabrication Rule
- Prompt must explicitly instruct: "Use os dados concretos listados. PROIBIDO inventar estatísticas."
- ResearchDigest provides `dataPoints[]` array that prompt MUST reference
- Source: Research §11 Diferencial 6 — "IA como assinatura, não atalho"

#### FR-DISC-05: Social Proof Discovery
- `proof-social` pillar needs discovery of real success stories
- Query generator targets: "resultados reais", "antes e depois", "case de sucesso"
- Source: Research §05 Pillar 4

---

## 6. Technical Architecture

### 6.1 Module Structure

```
src/modules/forge-shadowfeed/
├── forge-shadowfeed.types.ts            ← MODIFY (5 pillars, new types)
├── forge-shadowfeed.service.ts          ← MODIFY (weekly cadence, discovery v2)
├── forge-shadowfeed.controller.ts       ← MODIFY (new endpoints)
├── shadowfeed-prompt-builder.ts         ← REWRITE (9 blocks, hook archetypes, copy phases)
├── shadowfeed-persona.ts               ← REWRITE (Decoded-inspired voice)
├── shadowfeed-constants.ts             ← MODIFY (new CTAs, caption styles, product context)
├── shadowfeed-few-shots.ts             ← REWRITE (new examples per pillar)
├── shadowfeed-hook-archetypes.ts       ← NEW (6 archetypes + weighted selection)
├── shadowfeed-double-door.ts           ← NEW (content→product seed mapping)
├── shadowfeed-weekly-cadence.ts        ← NEW (day-of-week calendar)
├── template-rotation.ts                ← MODIFY (5 pillars)
├── shadowfeed-query-generator.ts       ← SEM MUDANÇA (move to discovery/ later)
├── shadowfeed-content-fetcher.ts       ← SEM MUDANÇA (move to discovery/ later)
├── shadowfeed-content-scorer.ts        ← SEM MUDANÇA (move to discovery/ later)
├── shadowfeed-scheduler.ts             ← SEM MUDANÇA
│
├── discovery/                           ← NEW directory
│   ├── shadowfeed-winner-scraper.ts     ← NEW (reuses url-scraper.ts)
│   ├── shadowfeed-content-summarizer.ts ← NEW (LLM extracts ResearchDigest)
│   └── shadowfeed-discovery.service.ts  ← NEW (6-stage pipeline orchestrator)
│
├── pillar-templates/
│   ├── educational-value.templates.ts   ← NEW (12 templates)
│   ├── wake-up-slap.templates.ts        ← REWRITE (10 templates)
│   ├── brand-breakdown.templates.ts     ← NEW (10 templates)
│   ├── proof-social.templates.ts        ← NEW (8 templates)
│   └── the-offer.templates.ts           ← REWRITE (10 templates)
```

### 6.2 Discovery Pipeline Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                    DISCOVERY ENGINE v2                              │
│                                                                    │
│  Stage 1: QUERY GEN ─── LLM generates 3-5 pillar-specific queries │
│       │                                                            │
│  Stage 2: MULTI-FETCH ─ Google News BR + Reddit BR + Twitter BR    │
│       │                  + Google Trends BR (parallel)              │
│       │                                                            │
│  Stage 3: SCORE ─────── Pillar-weighted scoring → select winner    │
│       │                                                            │
│  Stage 4: ★ SCRAPE ★ ── Puppeteer body extraction (4000 chars)    │
│       │                  Reuses scrapeBlogUrl() from url-scraper   │
│       │                                                            │
│  Stage 5: ★ SUMMARIZE ★ LLM extracts ResearchDigest:              │
│       │                  - keyInsight (1 sentence)                  │
│       │                  - dataPoints[] (numbers, %, R$)           │
│       │                  - provocativeAngle                         │
│       │                  - educationalAngle                         │
│       │                  - brandMentions[]                          │
│       │                  - quotableLines[] (slide headline ideas)   │
│       │                                                            │
│  Stage 6: RETURN ─────── ResearchDigest → Prompt Block 4           │
└────────────────────────────────────────────────────────────────────┘
```

### 6.3 Generation Pipeline (Updated)

```
Weekly Cadence (day → pillar + funnel_tier)
       │
Hook Archetype Selector (pillar → weighted archetype)
       │
Source Selection (discovery vs template, based on pillar.discoveryRatio)
       │
  ┌────┴────────────────────┐
  │ Discovery Pipeline v2   │ Template Selection
  │ (6 stages above)        │ (rotation-based)
  └────┬────────────────────┘     │
       │                          │
       └──────────┬───────────────┘
                  │
         9-Block Prompt Assembly
         [Persona + Pillar + Rules + Source/Research +
          Hook Archetype + Double Door + Product +
          Anti-Patterns + Output Format]
                  │
         LLM Call (OpenAI/Groq) + Validation
                  │
         Theme Application + Image Enrichment
                  │
         Save to DB + Queue (with hook_archetype,
         funnel_tier, double_door_seed metadata)
```

---

## 7. Discovery Engine v2

### 7.1 Winner Scraper

**File:** `src/modules/forge-shadowfeed/discovery/shadowfeed-winner-scraper.ts`

- Reuses `scrapeBlogUrl()` from `src/modules/manual-news/url-scraper.ts` (Puppeteer)
- Same pattern as `src/modules/forge-smart/smart-winner-scraper.ts`
- Twitter: uses thread content already fetched (skip scrape)
- Reddit: uses .json API for full selftext
- Google News / Blogs: Puppeteer → extract `<article>` or `<main>` body → 4000 chars
- Graceful fallback: scrape failure NEVER breaks pipeline

### 7.2 Content Summarizer

**File:** `src/modules/forge-shadowfeed/discovery/shadowfeed-content-summarizer.ts`

- LLM (gpt-4o-mini) reads scraped body → extracts `ResearchDigest`
- ResearchDigest fields:
  - `keyInsight`: 1-sentence core takeaway
  - `dataPoints[]`: Concrete numbers from the article (NEVER invented)
  - `provocativeAngle`: How to frame as wake-up-slap
  - `educationalAngle`: How to frame as educational
  - `brandMentions[]`: Companies/tools detected
  - `quotableLines[]`: 2-3 lines usable as slide headlines
  - `contentDepth`: shallow/medium/deep
  - `rawBody`: Original scraped text (up to 3000 chars)

### 7.3 Discovery Service Orchestrator

**File:** `src/modules/forge-shadowfeed/discovery/shadowfeed-discovery.service.ts`

- Orchestrates all 6 stages sequentially
- Returns `DiscoveryResult { digest, discoverySource }` or `DiscoveryFailure { reason }`
- Failure → service falls back to template (existing behavior)

### 7.4 Prompt Block 4 Enhancement

The `PromptSource` union type expands:
```
type PromptSource =
  | { type: 'discovery'; data: DiscoverySource }   // Legacy compat
  | { type: 'research'; data: ResearchDigest }      // NEW: enriched
  | { type: 'template'; data: PillarTemplate }
```

When type = `research`, Block 4 of the prompt includes:
- Key insight (1 sentence)
- All extracted data points with instruction "USE these — do NOT invent"
- Angle suggestion based on active pillar
- Quotable lines as headline inspiration
- Full article body for context depth

---

## 8. Content Strategy Engine

### 8.1 Hook Archetype Module

**File:** `src/modules/forge-shadowfeed/shadowfeed-hook-archetypes.ts`

6 archetypes with:
- Structure template with `{variable}` slots
- 3 examples per archetype (from Research §06)
- `bestForPillars` affinity list
- Weighted probability (specific-number highest at 0.25)
- Anti-repeat: no same archetype within last 2 posts

### 8.2 Double Door Module

**File:** `src/modules/forge-shadowfeed/shadowfeed-double-door.ts`

Maps content → product seed based on Research §08 Double Door table:
- Each pillar has 2-3 seed templates
- Seed placement: caption, penultimate slide, or last slide
- Seed intensity: whisper (top funnel), mention (mid), spotlight (bottom)
- The seed is injected into the prompt so the LLM naturally weaves it into copy

### 8.3 Weekly Cadence Module

**File:** `src/modules/forge-shadowfeed/shadowfeed-weekly-cadence.ts`

- Maps day-of-week → primary pillar + fallback pillar
- Tracks funnel tier per day
- Preferred hook archetypes per day
- `generateBatch()` now uses cadence instead of cycling all pillars

### 8.4 Persona Rewrite

**Key changes from v1:**
- Identity: AI that IS the proof of the product (Research §11 Diferencial 1)
- Copy: Direct, no hedging, sometimes brutal (Research §11 Diferencial 4)
- Anti-patterns: No guru-speak, no motivation, no begging engagement
- NEW rule: "O cover AFIRMA. Nunca pergunta." (Research §06)
- NEW rule: 3-phase copy progression in every carousel (Research §07)

### 8.5 Content Validator Updates

New allowed roles for the `editorial` pipeline:
- `hook` (existing)
- `context` (NEW — slides 2-3)
- `content` (existing)
- `tension` (NEW — antepenultimate)
- `soft-cta` (NEW — penultimate)
- `cta` (existing)

Structural validation rules:
- Slide 1: role MUST be `hook`
- Slides 2-3: role SHOULD be `context` (warning if not)
- Antepenultimate: role SHOULD be `tension` (warning if not)
- Penultimate: role SHOULD be `soft-cta` (warning if not)
- Last: role MUST be `cta`

---

## 9. Schema & Data Model

### 9.1 Migration: New Columns

```sql
-- 030_forge_shadowfeed_v2_decoded.sql

-- 1. Expand pillar_id constraint for new pillars
ALTER TABLE sf_shadowfeed_queue
  DROP CONSTRAINT IF EXISTS sf_shadowfeed_queue_pillar_id_check;

ALTER TABLE sf_shadowfeed_queue
  ADD CONSTRAINT sf_shadowfeed_queue_pillar_id_check
  CHECK (pillar_id IN (
    'educational-value', 'wake-up-slap', 'brand-breakdown',
    'proof-social', 'the-offer',
    'proof-of-machine', 'shadow-school'  -- legacy compat
  ));

-- 2. New metadata columns on queue
ALTER TABLE sf_shadowfeed_queue
  ADD COLUMN IF NOT EXISTS hook_archetype TEXT,
  ADD COLUMN IF NOT EXISTS funnel_tier TEXT
    CHECK (funnel_tier IN ('top', 'middle', 'bottom')),
  ADD COLUMN IF NOT EXISTS double_door_seed TEXT;

-- 3. New metadata columns on posts
ALTER TABLE sf_posts
  ADD COLUMN IF NOT EXISTS hook_archetype TEXT,
  ADD COLUMN IF NOT EXISTS funnel_tier TEXT,
  ADD COLUMN IF NOT EXISTS double_door_seed TEXT;

-- 4. Weekly cadence tracking
CREATE TABLE IF NOT EXISTS sf_shadowfeed_cadence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  pillar_id TEXT NOT NULL,
  hook_archetype TEXT,
  funnel_tier TEXT CHECK (funnel_tier IN ('top', 'middle', 'bottom')),
  queue_item_id UUID REFERENCES sf_shadowfeed_queue(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(week_start, day_of_week, pillar_id)
);

CREATE INDEX idx_cadence_week ON sf_shadowfeed_cadence(week_start);
```

### 9.2 Type System Updates

```typescript
// New PillarId union
export type PillarId =
  | 'educational-value'
  | 'wake-up-slap'
  | 'brand-breakdown'
  | 'proof-social'
  | 'the-offer';

// New types
export type HookArchetype =
  | 'direct-controversy'
  | 'specific-number'
  | 'transformative-promise'
  | 'polarization'
  | 'curiosity-mystery'
  | 'brand-comparison';

export type FunnelTier = 'top' | 'middle' | 'bottom';
export type SeedIntensity = 'whisper' | 'mention' | 'spotlight';
export type SeedPlacement = 'caption' | 'penultimate' | 'last';
```

---

## 10. API Endpoints

| Method | Route | Description | Change |
|---|---|---|---|
| POST | `/api/forge-shadowfeed/generate-batch` | Generate using weekly cadence | MODIFY |
| POST | `/api/forge-shadowfeed/generate/:pillarId` | Generate specific pillar | MODIFY (new IDs) |
| GET | `/api/forge-shadowfeed/cadence` | Get full weekly cadence plan | NEW |
| GET | `/api/forge-shadowfeed/cadence/today` | Get today's pillar assignment | NEW |
| GET | `/api/forge-shadowfeed/hook-archetypes` | List archetypes with usage stats | NEW |
| GET | `/api/forge-shadowfeed/queue` | Get queue items | NO CHANGE |
| GET | `/api/forge-shadowfeed/queue/recent` | Get recent 7 days | NO CHANGE |
| PUT | `/api/forge-shadowfeed/queue/:id/approve` | Approve post | NO CHANGE |
| PUT | `/api/forge-shadowfeed/queue/:id/caption` | Edit caption | NO CHANGE |
| POST | `/api/forge-shadowfeed/queue/:id/publish-now` | Publish immediately | NO CHANGE |
| GET | `/api/forge-shadowfeed/config` | Get config | NO CHANGE |
| PUT | `/api/forge-shadowfeed/config` | Update config | NO CHANGE |
| GET | `/api/forge-shadowfeed/stats` | Stats + pillar/archetype breakdown | MODIFY |

---

## 11. Acceptance Criteria by Epic

### Epic 1: Pillar System v2 (Foundation)
- [ ] AC1: Five pillar IDs defined in types with correct proportions
- [ ] AC2: PILLARS constant updated with new configs (times, slides, discoveryRatio)
- [ ] AC3: Template files created for all 5 pillar (50 templates total)
- [ ] AC4: Migration SQL runs without error, legacy IDs preserved
- [ ] AC5: `generatePillar()` accepts all 5 new pillar IDs

### Epic 2: Hook Archetype System
- [ ] AC1: 6 archetypes defined with structure templates, examples, pillar affinities
- [ ] AC2: Weighted selection with anti-repeat (no same archetype in 2 consecutive posts)
- [ ] AC3: Hook archetype injected into prompt Block 2 (pillar rules)
- [ ] AC4: `hook_archetype` saved to queue and post records
- [ ] AC5: FR-HOOK-07 enforced: hook slide is declarative, never interrogative

### Epic 3: Discovery Engine v2 (Research Pipeline)
- [ ] AC1: Winner scraper implemented, reuses `scrapeBlogUrl()` from url-scraper.ts
- [ ] AC2: Content summarizer extracts ResearchDigest with dataPoints, angles, brands
- [ ] AC3: Discovery service orchestrates 6-stage pipeline
- [ ] AC4: PromptSource union type includes `research` with ResearchDigest
- [ ] AC5: Prompt Block 4 for `research` type includes full data points and article body
- [ ] AC6: Discovery failure gracefully falls back to template (never breaks pipeline)
- [ ] AC7: >70% of discovery winners have scraped_body >200 chars

### Epic 4: Content Strategy Engine
- [ ] AC1: Persona rewritten with Decoded-inspired voice rules
- [ ] AC2: 3-phase copy system (interruption → development → conversion) in prompt
- [ ] AC3: Contextual CTAs mapped per pillar (save/comment/share/link)
- [ ] AC4: New slide roles (context, tension, soft-cta) in content validator
- [ ] AC5: Few-shot examples rewritten for all 5 pillars

### Epic 5: Conversion Pyramid & Double Door
- [ ] AC1: `funnel_tier` tracked on every generated post (top/middle/bottom)
- [ ] AC2: Double-door seed system maps pillar → product mention
- [ ] AC3: Seed injected into prompt (whisper/mention/spotlight intensity)
- [ ] AC4: >90% of non-offer posts contain product seed in caption or slide
- [ ] AC5: Offer pillar includes price anchoring + social proof + guarantee slides

### Epic 6: Weekly Cadence System
- [ ] AC1: Day-of-week → pillar mapping implemented
- [ ] AC2: `generateBatch()` uses cadence instead of all-pillar cycling
- [ ] AC3: Cadence table tracks weekly generation history
- [ ] AC4: `GET /cadence` and `GET /cadence/today` endpoints operational
- [ ] AC5: >80% of posts match day-of-week pillar plan over 30 days

---

## 12. Scope

### IN SCOPE
- Backend forge-shadowfeed module overhaul (all files listed in §6.1)
- Discovery pipeline v2 with scraping + summarization
- 5-pillar system with all templates
- Hook archetype system
- Double-door conversion system
- Weekly cadence
- SQL migration
- Content validator updates

### OUT OF SCOPE
- Frontend admin dashboard changes (separate epic)
- Instagram rendering/design changes (handled by design system)
- New LLM providers beyond OpenAI/Groq
- YouTube and Niche Blog RSS sources (future enhancement — current 4 sources are sufficient for MVP)
- Cache layer for discovery (optimization — not required for MVP)
- Forge-personalized changes (separate module)

---

## 13. Dependencies & Risks

### Dependencies
| Dependency | Status | Impact |
|---|---|---|
| Puppeteer (url-scraper.ts) | Already installed and working | Zero risk — reuse existing |
| OpenAI API (gpt-4o-mini) | Already configured | Summarizer adds ~1 extra LLM call per discovery post |
| Supabase schema access | Available | Migration required before code deployment |
| Content validator (content-schema.ts) | Exists | Needs new role types added |

### Risks
| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Scraper blocked by news sites | Medium | Reduced content depth | Graceful fallback to title+snippet (same as v1) |
| Summarizer LLM cost increase | Low | ~$0.002 per post extra | gpt-4o-mini is cheap; max 7 calls/day |
| Template count (50) takes time to write | High | Delays launch | Start with 6 templates per pillar (30 total MVP), expand post-launch |
| Legacy pillar IDs in existing data | Medium | Queue history breaks | Migration preserves legacy IDs with backward-compatible constraint |

---

## 14. Epic Breakdown

### Recommended Implementation Order

| # | Epic | Dependencies | Priority | Effort |
|---|---|---|---|---|
| 1 | **Pillar System v2** — types, PILLARS const, migration, basic templates | None | P0 | Large |
| 2 | **Discovery Engine v2** — scraper, summarizer, discovery service | Epic 1 | P0 | Large |
| 3 | **Content Strategy Engine** — persona, copy phases, validator, few-shots | Epic 1 | P0 | Large |
| 4 | **Hook Archetype System** — archetypes, selection, prompt injection | Epic 1 | P1 | Medium |
| 5 | **Conversion Pyramid & Double Door** — funnel tracking, seed system | Epics 1, 3 | P1 | Medium |
| 6 | **Weekly Cadence** — day-of-week calendar, batch integration | Epics 1, 4, 5 | P1 | Medium |

### Wave Structure for Parallel Development

**Wave 1 (Foundation):** Epic 1 — Must complete first (types, migration, pillar configs)

**Wave 2 (Core — Parallel):** Epics 2 + 3 — Can run in parallel
- Epic 2 modifies discovery pipeline (Stage 4-5 additions)
- Epic 3 modifies prompt builder (new blocks, persona, validator)

**Wave 3 (Strategy — Parallel):** Epics 4 + 5 — Can run in parallel
- Epic 4 adds hook system (self-contained module + prompt injection)
- Epic 5 adds double-door (self-contained module + prompt injection)

**Wave 4 (Integration):** Epic 6 — Integrates everything into weekly cadence

---

## 15. Verification Plan

### End-to-End Tests

| # | Test | Validates |
|---|---|---|
| 1 | Generate `educational-value` post → verify 8-12 slides, hook is declarative | FR-PIL-01, FR-HOOK-07, FR-STRUCT-08 |
| 2 | Generate `wake-up-slap` post → verify 4-6 slides, polarizing copy | FR-PIL-02, FR-STRUCT-07, FR-COPY-01 |
| 3 | Generate `brand-breakdown` post → verify brand name in content | FR-PIL-03, FR-DISC-02 |
| 4 | Generate `proof-social` post → verify "Quer o mesmo?" seed | FR-PIL-04, FR-FUNNEL-04 |
| 5 | Generate `the-offer` post → verify price anchoring + guarantee | FR-PIL-05, FR-FUNNEL-06 |
| 6 | Generate 10 posts → verify all 6 hook archetypes appear | FR-HOOK-01 to FR-HOOK-06 |
| 7 | Discovery winner with URL → verify scraped_body >200 chars | FR-DISC-03 |
| 8 | ResearchDigest output → verify dataPoints[] non-empty | FR-DISC-01 |
| 9 | Generate batch on Monday → verify `educational-value` selected | FR-CAD-02 |
| 10 | Generate 30 posts → verify ~30/25/20/15/10 distribution | FR-PIL-01 through FR-PIL-05 |
| 11 | Audit captions → verify >90% non-offer posts have product seed | FR-FUNNEL-04 |
| 12 | Check slide roles → verify context/tension/soft-cta zones present | FR-STRUCT-02, FR-STRUCT-04, FR-STRUCT-05 |

---

> **TRACEABILITY GUARANTEE:** Every functional requirement in this PRD traces to a specific section and finding in `/pesquisabrandsdecoded.md`. The Strategy Traceability Matrix (§4) provides the complete audit trail. Any implementation that cannot be traced to the research document is out of scope.

---

*— Morgan, planejando o futuro* 📊
