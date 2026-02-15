# PROJECT SHADOWFEED — PRD v1.0

> **Classificação:** Operacional
> **Codename:** SHADOWFEED
> **Documento otimizado para execução via Claude Code.**
> Cada seção contém instruções diretas e implementáveis. Siga a Ordem de Implementação (seção 12) de forma sequencial. Só avance de fase quando a anterior estiver testável e funcional.

---

## 1. Resumo

**SHADOWFEED** é um sistema automatizado de inteligência de conteúdo e produção de carousels para Instagram, focado no nicho de AI, Tecnologia e Automações.

O sistema opera em **3 módulos**:

1. **RECON** (Reconhecimento) — Scraper multi-fonte que coleta diariamente: carousels virais do Instagram (referências de design), notícias trending, Google Trends, Reddit e X/Twitter. Usa Playwright com stealth para extração visual e textual.
2. **FORGE** (Forja) — Engine de geração via Gemini 2.0 Pro. Recebe tema + referências visuais + contexto de notícia e produz um JSON estruturado com o carousel completo: texto de cada slide, layout, design specs, copy, caption e hashtags.
3. **RENDER** (Renderização) — Transforma o JSON em imagens PNG 1080×1350 (4:5) via React/Tailwind + Puppeteer. Output pronto para publicação.

Publicação: **semi-automática** (SHADOWFEED gera tudo, operador revisa e publica).

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Runtime** | Node.js | 20+ LTS |
| **Linguagem** | TypeScript | 5.6+ |
| **Framework API** | Express | 4.21+ |
| **Banco de Dados** | Supabase (PostgreSQL) | Free tier |
| **Scraping** | Playwright + playwright-extra + stealth | 1.49+ |
| **Screenshots/PNG** | Puppeteer | 23+ |
| **Frontend Renderer** | React 18 + Tailwind CSS 3.4 + Vite 6 | — |
| **IA** | Google Gemini 2.0 Pro (`gemini-2.0-pro`) | via @google/generative-ai SDK |
| **Cron/Scheduler** | node-cron | 3.0+ |
| **News** | rss-parser (Google News RSS) | 3.13+ |
| **Reddit** | snoowrap | 1.23+ |
| **Google Trends** | google-trends-api | 4.9+ |
| **X/Twitter** | Playwright (scrape público, sem API) | — |
| **Validação** | Zod | 3.23+ |
| **Logging** | Pino | 9+ |

---

## 3. Estrutura de Pastas

```
shadowfeed/
├── package.json
├── tsconfig.json
├── .env
├── .env.example
├── README.md
├── ig-session.json                        # Sessão Playwright do Instagram (gerada manualmente)
│
├── src/
│   ├── index.ts                           # Entry point — Express + cron jobs
│   │
│   ├── config/
│   │   ├── env.ts                         # Validação de env vars com Zod
│   │   ├── supabase.ts                    # Cliente Supabase
│   │   ├── gemini.ts                      # Cliente Gemini 2.0 Pro
│   │   └── logger.ts                      # Pino logger
│   │
│   ├── modules/
│   │   │
│   │   ├── recon/                         # ══ MÓDULO RECON (Reconhecimento) ══
│   │   │   ├── recon.controller.ts        # Endpoints do scraper
│   │   │   ├── recon.service.ts           # Orquestra todas as fontes
│   │   │   ├── recon.types.ts             # Tipos/interfaces do módulo
│   │   │   ├── sources/
│   │   │   │   ├── instagram.source.ts    # Playwright: scrape carousels IG
│   │   │   │   ├── news.source.ts         # Google News via RSS
│   │   │   │   ├── trends.source.ts       # Google Trends API
│   │   │   │   ├── reddit.source.ts       # Reddit API via snoowrap
│   │   │   │   └── twitter.source.ts      # X/Twitter via Playwright (público)
│   │   │   └── design-extractor.ts        # Gemini Vision: screenshot → JSON design
│   │   │
│   │   ├── forge/                         # ══ MÓDULO FORGE (Geração) ══
│   │   │   ├── forge.controller.ts        # Endpoints de geração
│   │   │   ├── forge.service.ts           # Orquestra pipeline de geração
│   │   │   ├── forge.types.ts             # Tipos do módulo
│   │   │   ├── prompt-builder.ts          # Monta prompt completo com contexto
│   │   │   ├── reference-picker.ts        # Seleciona referências do Supabase
│   │   │   ├── output-validator.ts        # Valida JSON do Gemini com Zod
│   │   │   └── prompts/
│   │   │       ├── system.prompt.ts       # System instruction principal
│   │   │       └── fewshot.prompt.ts      # Few-shot examples
│   │   │
│   │   ├── render/                        # ══ MÓDULO RENDER (Renderização) ══
│   │   │   ├── render.controller.ts       # Endpoints de renderização
│   │   │   ├── render.service.ts          # Orquestra React → Puppeteer → PNG
│   │   │   ├── render.types.ts            # Tipos do módulo
│   │   │   ├── slide-server.ts            # Express estático servindo React build
│   │   │   └── capture.ts                 # Puppeteer: viewport 1080x1350 → PNG
│   │   │
│   │   └── pipeline/                      # ══ PIPELINE (Orquestração) ══
│   │       ├── pipeline.controller.ts     # Endpoint de execução completa
│   │       ├── pipeline.service.ts        # RECON → FORGE → RENDER
│   │       └── scheduler.ts              # node-cron: 2x ao dia
│   │
│   ├── shared/
│   │   ├── middleware/
│   │   │   ├── error-handler.ts
│   │   │   └── request-logger.ts
│   │   ├── utils/
│   │   │   ├── retry.ts                   # Retry com exponential backoff
│   │   │   ├── delay.ts                   # Delays humanizados para scraping
│   │   │   ├── token-estimator.ts         # Estima tokens para controle de custo
│   │   │   └── file-manager.ts            # Gerencia output de PNGs
│   │   └── types/
│   │       └── global.types.ts
│   │
│   └── routes/
│       └── index.ts                       # Agregador de rotas
│
├── renderer/                              # React app para renderização de slides
│   ├── package.json
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── App.tsx                        # Lê JSON da query string → renderiza slide
│       ├── main.tsx
│       ├── components/
│       │   ├── SlideRouter.tsx            # Switcher de layout por slide.role
│       │   ├── layouts/
│       │   │   ├── HookLayout.tsx         # Slide 1: headline impactante
│       │   │   ├── ContentLayout.tsx      # Slides de conteúdo (título + corpo)
│       │   │   ├── ListLayout.tsx         # Slide com itens numerados
│       │   │   ├── QuoteLayout.tsx        # Slide de citação
│       │   │   └── CTALayout.tsx          # Slide final com call-to-action
│       │   └── primitives/
│       │       ├── SlideFrame.tsx         # Container 1080x1350 com padding seguro
│       │       ├── Headline.tsx           # Texto headline estilizado
│       │       ├── BodyText.tsx           # Texto corpo estilizado
│       │       ├── NumberBadge.tsx        # Badge numérico (01, 02, etc.)
│       │       ├── Divider.tsx            # Divisor decorativo
│       │       └── Emoji.tsx             # Emoji com sizing consistente
│       ├── styles/
│       │   └── globals.css               # @import tailwind + Google Fonts
│       └── types/
│           └── slide.types.ts
│
└── output/                                # PNGs gerados
    └── [YYYY-MM-DD]/
        └── [post-id]/
            ├── slide-01.png
            ├── slide-02.png
            ├── ...
            └── metadata.json             # Cópia do JSON gerado pelo FORGE
```

---

## 4. Dependências Principais

### Backend (`package.json`)

```json
{
  "name": "shadowfeed",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "recon": "tsx src/modules/recon/recon.service.ts",
    "forge": "tsx src/modules/forge/forge.service.ts",
    "pipeline": "tsx src/modules/pipeline/pipeline.service.ts",
    "ig:login": "npx playwright codegen https://instagram.com --save-storage=ig-session.json"
  },
  "dependencies": {
    "express": "^4.21.1",
    "@supabase/supabase-js": "^2.47.10",
    "@google/generative-ai": "^0.21.0",
    "playwright": "^1.49.1",
    "playwright-extra": "^4.3.6",
    "puppeteer-extra-plugin-stealth": "^2.11.2",
    "puppeteer": "^23.9.0",
    "node-cron": "^3.0.3",
    "snoowrap": "^1.23.0",
    "rss-parser": "^3.13.0",
    "google-trends-api": "^4.9.2",
    "zod": "^3.23.8",
    "pino": "^9.5.0",
    "pino-pretty": "^13.0.0",
    "dotenv": "^16.4.7",
    "uuid": "^11.0.3",
    "archiver": "^7.0.1"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "tsx": "^4.19.2",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.1",
    "@types/node-cron": "^3.0.11",
    "@types/uuid": "^10.0.0",
    "@types/archiver": "^6.0.3"
  }
}
```

### Renderer (`renderer/package.json`)

```json
{
  "name": "shadowfeed-renderer",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite --port 3001",
    "build": "vite build",
    "preview": "vite preview --port 3001"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.6.3",
    "vite": "^6.0.3"
  }
}
```

---

## 5. Schema SQL (Supabase)

```sql
-- ╔══════════════════════════════════════════════════════════════╗
-- ║                   PROJECT SHADOWFEED                         ║
-- ║                   Database Schema v1.0                       ║
-- ╚══════════════════════════════════════════════════════════════╝

-- ============================================================
-- TABELA: sf_intel_sources
-- Notícias, trends, posts do Reddit/X coletados pelo RECON
-- ============================================================
CREATE TABLE sf_intel_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    source_type TEXT NOT NULL CHECK (source_type IN (
        'google_news',
        'google_trends',
        'reddit',
        'twitter',
        'manual'
    )),
    
    -- Conteúdo coletado
    title TEXT NOT NULL,
    summary TEXT,
    url TEXT,
    author TEXT,
    
    -- Classificação
    category TEXT CHECK (category IN (
        'ai_models',       -- Novos modelos, releases, benchmarks
        'ai_tools',        -- Ferramentas, apps, produtos
        'automation',      -- Automações, workflows, no-code
        'coding',          -- Dev tools, frameworks, linguagens
        'industry_news',   -- Empresas, funding, aquisições
        'tutorials',       -- How-to, guides, tips
        'opinion'          -- Debates, análises, previsões
    )),
    
    -- Métricas da fonte (quando disponível)
    source_score NUMERIC(6,1),   -- upvotes, likes, etc
    source_comments INTEGER,
    
    -- Controle
    relevance_score NUMERIC(4,2) DEFAULT 5.0 CHECK (relevance_score BETWEEN 0 AND 10),
    used BOOLEAN DEFAULT FALSE,
    used_in_post_id UUID,
    
    collected_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 days'),
    
    CONSTRAINT sf_intel_title_min CHECK (char_length(title) >= 5)
);

CREATE INDEX idx_sf_intel_unused ON sf_intel_sources(used, relevance_score DESC) WHERE used = FALSE;
CREATE INDEX idx_sf_intel_source ON sf_intel_sources(source_type, collected_at DESC);
CREATE INDEX idx_sf_intel_category ON sf_intel_sources(category, collected_at DESC);
CREATE INDEX idx_sf_intel_expires ON sf_intel_sources(expires_at);

-- ============================================================
-- TABELA: sf_carousel_refs
-- Carousels do Instagram coletados como referência de design
-- ============================================================
CREATE TABLE sf_carousel_refs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificação do post
    ig_post_id TEXT UNIQUE NOT NULL,
    ig_post_url TEXT NOT NULL,
    account_handle TEXT NOT NULL,
    account_followers INTEGER,
    
    -- Métricas
    likes INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    engagement_rate NUMERIC(5,2),
    viral_score NUMERIC(4,2) DEFAULT 0,
    
    -- Conteúdo textual
    caption TEXT,
    hashtags TEXT[],
    slide_count INTEGER NOT NULL,
    
    -- Design de cada slide (extraído pelo Gemini Vision)
    slides JSONB NOT NULL DEFAULT '[]',
    /*
    slides: [{
        slide_number: 1,
        role: "hook",
        text_content: "texto visível",
        text_position: "center",
        text_align: "center",
        font_size: "large",
        font_weight: "extrabold",
        font_style: "sans-serif",
        bg_type: "gradient",
        bg_description: "gradiente escuro roxo para preto",
        color_palette: ["#1a0a2e", "#7c3aed", "#ffffff"],
        layout_pattern: "headline-only",
        has_icon: false,
        icon_description: null,
        quality_score: 8
    }]
    */
    
    -- Análise agregada do carousel
    design_summary JSONB,
    /*
    design_summary: {
        overall_style: "dark-minimal",
        primary_colors: ["#0a0a0a", "#7c3aed", "#ffffff"],
        hook_technique: "question",
        typography_style: "bold-sans",
        layout_flow: ["headline-only", "title-body", "title-body", "cta-action"]
    }
    */
    
    -- Screenshots (Supabase Storage paths)
    screenshot_urls TEXT[],
    
    posted_at TIMESTAMPTZ,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT sf_ref_slides CHECK (slide_count BETWEEN 2 AND 20)
);

CREATE INDEX idx_sf_refs_viral ON sf_carousel_refs(viral_score DESC);
CREATE INDEX idx_sf_refs_account ON sf_carousel_refs(account_handle);
CREATE INDEX idx_sf_refs_scraped ON sf_carousel_refs(scraped_at DESC);
CREATE INDEX idx_sf_refs_style ON sf_carousel_refs USING GIN (design_summary);

-- ============================================================
-- TABELA: sf_posts
-- Posts gerados pelo FORGE
-- ============================================================
CREATE TABLE sf_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Origem
    intel_source_id UUID REFERENCES sf_intel_sources(id),
    reference_ids UUID[],           -- IDs dos sf_carousel_refs usados como inspiração
    
    -- Conteúdo gerado
    theme TEXT NOT NULL,
    style TEXT NOT NULL CHECK (style IN (
        'dark-minimal',
        'gradient-modern',
        'clean-light',
        'bold-colorful',
        'neon-tech',
        'editorial-mono'
    )),
    
    slides JSONB NOT NULL,
    /*
    slides: [{
        slide: 1,
        role: "hook",
        headline: "texto principal",
        body: "texto secundário ou null",
        layout: "headline-only",
        bg_color: "#0a0a0a",
        bg_gradient: "linear-gradient(135deg, #0a0a0a 0%, #1a0a2e 100%)" ou null,
        text_color: "#ffffff",
        accent_color: "#7c3aed",
        font_headline: "Space Grotesk",
        font_body: "Inter",
        font_size_headline: "36px",
        font_weight_headline: "800",
        font_size_body: "20px",
        text_align: "center",
        icon: "🤖" ou null,
        number_label: "01" ou null,
        decorative_elements: ["top-line-accent", "bottom-gradient-fade"] ou []
    }]
    */
    slide_count INTEGER NOT NULL,
    
    -- Copy
    caption TEXT NOT NULL,
    hashtags TEXT[] NOT NULL,
    cta_text TEXT,
    posting_time TEXT,              -- "14:00 BRT"
    
    -- Paleta global
    color_palette JSONB NOT NULL,
    /*
    color_palette: {
        bg_primary: "#0a0a0a",
        bg_secondary: "#1a0a2e",
        text_primary: "#ffffff",
        text_secondary: "#a0a0a0",
        accent: "#7c3aed"
    }
    */
    
    -- Fontes
    fonts JSONB NOT NULL,
    /*
    fonts: {
        headline: "Space Grotesk",
        body: "Inter"
    }
    */
    
    -- Metadados de geração
    gemini_model TEXT DEFAULT 'gemini-2.0-pro',
    input_tokens INTEGER,
    output_tokens INTEGER,
    generation_cost_usd NUMERIC(8,6),
    generation_time_ms INTEGER,
    prompt_version TEXT DEFAULT 'v1',
    
    -- Status
    status TEXT DEFAULT 'draft' CHECK (status IN (
        'draft',           -- JSON gerado, aguardando render
        'rendered',        -- PNGs gerados, aguardando revisão
        'approved',        -- Aprovado pelo operador
        'published',       -- Publicado no Instagram
        'rejected'         -- Rejeitado pelo operador
    )),
    rejection_reason TEXT,
    
    -- Arquivos renderizados
    rendered_paths TEXT[],          -- ["output/2025-02-10/abc/slide-01.png", ...]
    
    -- Instagram (preenchido após publicação)
    ig_post_id TEXT,
    ig_post_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    rendered_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ
);

CREATE INDEX idx_sf_posts_status ON sf_posts(status, created_at DESC);
CREATE INDEX idx_sf_posts_intel ON sf_posts(intel_source_id);
CREATE INDEX idx_sf_posts_style ON sf_posts(style);
CREATE INDEX idx_sf_posts_created ON sf_posts(created_at DESC);

-- ============================================================
-- VIEW: posts prontos para revisão
-- ============================================================
CREATE VIEW sf_v_pending_review AS
SELECT 
    p.id,
    p.theme,
    p.style,
    p.slide_count,
    p.caption,
    p.hashtags,
    p.posting_time,
    p.rendered_paths,
    p.created_at,
    p.rendered_at,
    i.title AS source_title,
    i.source_type,
    i.url AS source_url
FROM sf_posts p
LEFT JOIN sf_intel_sources i ON p.intel_source_id = i.id
WHERE p.status = 'rendered'
ORDER BY p.created_at DESC;

-- ============================================================
-- VIEW: histórico de publicações
-- ============================================================
CREATE VIEW sf_v_published AS
SELECT 
    p.id,
    p.theme,
    p.style,
    p.slide_count,
    p.ig_post_url,
    p.gemini_model,
    p.generation_cost_usd,
    p.published_at,
    i.source_type,
    i.category
FROM sf_posts p
LEFT JOIN sf_intel_sources i ON p.intel_source_id = i.id
WHERE p.status = 'published'
ORDER BY p.published_at DESC;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE sf_intel_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_carousel_refs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sf_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON sf_intel_sources FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON sf_carousel_refs FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_role_all" ON sf_posts FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- FUNÇÃO: limpar dados expirados (executar via cron do Supabase)
-- ============================================================
CREATE OR REPLACE FUNCTION sf_cleanup_expired()
RETURNS void AS $$
BEGIN
    DELETE FROM sf_intel_sources WHERE expires_at < NOW() AND used = FALSE;
END;
$$ LANGUAGE plpgsql;
```

---

## 6. Fluxo de Dados Principal

```
╔═══════════════════════════════════════════════════════════════════════╗
║                     PROJECT SHADOWFEED                               ║
║                Pipeline Diário (2x ao dia)                           ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  ┌──────────────────────────────────────────────────────────────┐    ║
║  │ ░░ RECON — Reconhecimento (node-cron: 08:00 e 14:00 BRT) ░░ │    ║
║  └──────────────────────────┬───────────────────────────────────┘    ║
║                             │                                         ║
║         ┌───────────┬───────┼───────┬────────────┐                   ║
║         ▼           ▼       ▼       ▼            ▼                   ║
║   ┌──────────┐ ┌────────┐ ┌─────┐ ┌──────┐ ┌─────────┐            ║
║   │ Google   │ │ Google │ │ Red │ │  X/  │ │  Insta  │            ║
║   │ News RSS │ │ Trends │ │ dit │ │ Twit │ │  gram   │            ║
║   │          │ │  API   │ │ API │ │ ter  │ │ Playwrt │            ║
║   └────┬─────┘ └───┬────┘ └──┬──┘ └──┬───┘ └────┬────┘            ║
║        │            │         │       │          │                    ║
║        │            │         │       │     ┌────┴─────────┐        ║
║        │            │         │       │     │ Screenshot   │        ║
║        │            │         │       │     │ cada slide   │        ║
║        │            │         │       │     └────┬─────────┘        ║
║        │            │         │       │          │                    ║
║        │            │         │       │     ┌────┴──────────┐       ║
║        │            │         │       │     │ Gemini Vision │       ║
║        │            │         │       │     │ → JSON design │       ║
║        │            │         │       │     └────┬──────────┘       ║
║        │            │         │       │          │                    ║
║        ▼            ▼         ▼       ▼          ▼                    ║
║   ┌─────────────────────────────────────────────────────────┐       ║
║   │                    SUPABASE                              │       ║
║   │   sf_intel_sources          sf_carousel_refs             │       ║
║   │   (notícias/trends)         (referências design)         │       ║
║   └──────────────────────────┬──────────────────────────────┘       ║
║                              │                                        ║
║  ┌───────────────────────────┴────────────────────────────────┐     ║
║  │ ░░ FORGE — Geração de Conteúdo ░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ║
║  │                                                             │     ║
║  │  1. reference-picker.ts                                     │     ║
║  │     → Seleciona top 3 carousels por viral_score             │     ║
║  │     → Filtra por estilo similar ao tema                     │     ║
║  │                                                             │     ║
║  │  2. prompt-builder.ts monta:                                │     ║
║  │     ┌─────────────────────────────────────────────┐        │     ║
║  │     │ SYSTEM INSTRUCTION (regras design + formato) │        │     ║
║  │     │ + FEW-SHOT EXAMPLES (2-3 carousels perfeitos)│        │     ║
║  │     │ + REFERÊNCIAS (design dos carousels virais)  │        │     ║
║  │     │ + TEMA (intel source selecionado)            │        │     ║
║  │     │ + NOTÍCIA (resumo + contexto)                │        │     ║
║  │     └──────────────────┬──────────────────────────┘        │     ║
║  │                        │                                    │     ║
║  │                        ▼                                    │     ║
║  │     ┌──────────────────────────────┐                       │     ║
║  │     │ Gemini 2.0 Pro API           │                       │     ║
║  │     │ generateContent()            │                       │     ║
║  │     │ responseMimeType: "json"     │                       │     ║
║  │     └──────────────────┬───────────┘                       │     ║
║  │                        │                                    │     ║
║  │                        ▼                                    │     ║
║  │     ┌──────────────────────────────┐                       │     ║
║  │     │ output-validator.ts           │                       │     ║
║  │     │ Zod parse → CarouselSchema    │                       │     ║
║  │     │ Se inválido: retry 1x         │                       │     ║
║  │     │ → sf_posts (status: 'draft')  │                       │     ║
║  │     └──────────────────────────────┘                       │     ║
║  └───────────────────────────┬────────────────────────────────┘     ║
║                              │                                        ║
║  ┌───────────────────────────┴────────────────────────────────┐     ║
║  │ ░░ RENDER — Renderização ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ║
║  │                                                             │     ║
║  │  1. slide-server.ts serve React app em :3001                │     ║
║  │                                                             │     ║
║  │  2. Para cada slide do JSON:                                │     ║
║  │     URL: http://localhost:3001/?data={base64_json}&slide=0  │     ║
║  │                                                             │     ║
║  │  3. capture.ts (Puppeteer):                                 │     ║
║  │     → viewport: 1080 x 1350                                │     ║
║  │     → waitForSelector('.slide-ready')                       │     ║
║  │     → page.screenshot({ type: 'png' })                     │     ║
║  │                                                             │     ║
║  │  4. Salva em: output/YYYY-MM-DD/{post-id}/slide-NN.png     │     ║
║  │     + metadata.json (cópia do JSON completo)                │     ║
║  │                                                             │     ║
║  │  5. Atualiza sf_posts:                                      │     ║
║  │     status → 'rendered'                                     │     ║
║  │     rendered_paths → [array de paths]                       │     ║
║  │     rendered_at → NOW()                                     │     ║
║  └───────────────────────────┬────────────────────────────────┘     ║
║                              │                                        ║
║                              ▼                                        ║
║  ┌────────────────────────────────────────────────────────────┐     ║
║  │ ░░ REVISÃO HUMANA ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │     ║
║  │                                                             │     ║
║  │  GET /api/posts?status=rendered                             │     ║
║  │  → Operador visualiza PNGs + caption + hashtags             │     ║
║  │  → PATCH /api/posts/:id/approve  (status → 'approved')     │     ║
║  │  → PATCH /api/posts/:id/reject   (status → 'rejected')     │     ║
║  │  → Publica manualmente no Instagram                         │     ║
║  │  → PATCH /api/posts/:id/publish  (status → 'published')    │     ║
║  └────────────────────────────────────────────────────────────┘     ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 7. Lógica Crítica / Algoritmos Específicos

### 7.1 — Gemini Client Config

```typescript
// src/config/gemini.ts

import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from './env';

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Modelo principal para geração de carousels
export const forgeModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-pro',
  generationConfig: {
    temperature: 0.8,          // Criativo mas controlado
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 4096,
    responseMimeType: 'application/json',  // Força output JSON
  },
});

// Modelo para análise de design (Vision)
export const visionModel = genAI.getGenerativeModel({
  model: 'gemini-2.0-pro',
  generationConfig: {
    temperature: 0.1,          // Factual para análise
    maxOutputTokens: 2048,
    responseMimeType: 'application/json',
  },
});
```

### 7.2 — Instagram Carousel Scraper (RECON)

```typescript
// src/modules/recon/sources/instagram.source.ts

import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
import { logger } from '../../../config/logger';
import { humanDelay, shortDelay } from '../../../shared/utils/delay';
import type { RawCarouselData } from '../recon.types';

chromium.use(stealth());

// Contas alvo — editar conforme necessário via .env
const TARGET_ACCOUNTS = (process.env.IG_SCRAPE_ACCOUNTS || '').split(',').filter(Boolean);

export async function scrapeInstagramCarousels(
  maxPerAccount: number = 5
): Promise<RawCarouselData[]> {
  
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const context = await browser.newContext({
    storageState: process.env.IG_SESSION_PATH || './ig-session.json',
    viewport: { width: 1280, height: 900 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  });

  const results: RawCarouselData[] = [];

  for (const account of TARGET_ACCOUNTS) {
    try {
      logger.info({ account }, '[RECON] Infiltrating account');
      const page = await context.newPage();

      // Navega para o perfil
      await page.goto(`https://www.instagram.com/${account}/`, {
        waitUntil: 'domcontentloaded',
        timeout: 30000,
      });
      await humanDelay(3000, 6000);

      // Fecha popup de login se aparecer
      const loginClose = await page.$('[aria-label="Close"]');
      if (loginClose) await loginClose.click();

      // Coleta URLs dos posts recentes
      const postLinks = await page.$$eval(
        'a[href*="/p/"]',
        (anchors: HTMLAnchorElement[]) =>
          [...new Set(anchors.map(a => a.getAttribute('href')!))]
            .filter(Boolean)
            .slice(0, 12)
      );

      logger.info({ account, postsFound: postLinks.length }, '[RECON] Posts found');

      let collected = 0;

      for (const link of postLinks) {
        if (collected >= maxPerAccount) break;

        try {
          const fullUrl = `https://www.instagram.com${link}`;
          await page.goto(fullUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
          await humanDelay(2000, 4000);

          // Detecta se é carousel
          const nextBtn = await page.$('button[aria-label="Next"]');
          if (!nextBtn) continue;  // Pula posts single image

          // Extrai métricas e caption
          const meta = await page.evaluate(() => {
            const likesEl = document.querySelector('section span span');
            const captionEl = document.querySelector('h1');
            const timeEl = document.querySelector('time');
            
            return {
              likes: parseInt(likesEl?.textContent?.replace(/[,.]/g, '') || '0'),
              caption: captionEl?.textContent?.trim() || '',
              postedAt: timeEl?.getAttribute('datetime') || null,
            };
          });

          // Screenshot de cada slide
          const slideScreenshots: Buffer[] = [];
          const carouselArea = await page.$('article [role="presentation"]');
          
          if (carouselArea) {
            // Slide 1
            slideScreenshots.push(await carouselArea.screenshot({ type: 'png' }));

            // Slides 2+
            let hasMore = true;
            while (hasMore) {
              const btn = await page.$('button[aria-label="Next"]');
              if (!btn) { hasMore = false; break; }
              
              await btn.click();
              await shortDelay(600, 1000);
              slideScreenshots.push(await carouselArea.screenshot({ type: 'png' }));
            }
          }

          if (slideScreenshots.length < 2) continue;

          const postId = link.split('/p/')[1]?.replace(/\//g, '') || '';
          const hashtags = meta.caption.match(/#[\w\u00C0-\u024F]+/g) || [];

          results.push({
            ig_post_id: postId,
            ig_post_url: fullUrl,
            account_handle: account,
            likes: meta.likes,
            comments: 0,  // Difícil extrair com precisão via scraping
            caption: meta.caption,
            hashtags,
            slide_count: slideScreenshots.length,
            slide_buffers: slideScreenshots,
            posted_at: meta.postedAt,
          });

          collected++;
          logger.info({ account, postId, slides: slideScreenshots.length }, '[RECON] Carousel captured');
          
          await humanDelay(5000, 12000);

        } catch (err) {
          logger.warn({ link, error: (err as Error).message }, '[RECON] Post extraction failed');
        }
      }

      await page.close();
      await humanDelay(15000, 25000); // Delay longo entre contas

    } catch (err) {
      logger.error({ account, error: (err as Error).message }, '[RECON] Account infiltration failed');
    }
  }

  await browser.close();
  logger.info({ total: results.length }, '[RECON] Instagram sweep complete');
  return results;
}
```

### 7.3 — Design Extractor (Gemini Vision)

```typescript
// src/modules/recon/design-extractor.ts

import { visionModel } from '../../config/gemini';
import { logger } from '../../config/logger';

const VISION_PROMPT = `Analise esta imagem de um slide de carousel do Instagram.
Retorne SOMENTE JSON válido com esta estrutura exata:

{
  "slide_role": "hook | content | list | quote | cta",
  "text_content": "texto exato visível",
  "text_position": "top-left | top-center | center | center-left | bottom-center",
  "text_align": "left | center | right",
  "font_size": "small | medium | large | xl",
  "font_weight": "regular | medium | bold | extrabold",
  "font_style": "serif | sans-serif | mono | display",
  "bg_type": "solid | gradient | image | pattern",
  "bg_description": "descrição breve",
  "color_palette": ["#hex1", "#hex2", "#hex3"],
  "primary_text_color": "#hex",
  "layout_pattern": "headline-only | title-body | numbered-list | icon-grid | quote-attribution | cta-button",
  "has_icon": true | false,
  "icon_description": "emoji ou descrição",
  "decorative_elements": ["lista de elementos decorativos: linhas, gradientes, sombras, etc"],
  "quality_score": 1-10
}`;

export async function extractSlideDesign(
  screenshotBuffer: Buffer
): Promise<Record<string, unknown>> {
  try {
    const base64 = screenshotBuffer.toString('base64');

    const result = await visionModel.generateContent([
      VISION_PROMPT,
      {
        inlineData: {
          mimeType: 'image/png',
          data: base64,
        },
      },
    ]);

    const text = result.response.text();
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);

  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON] Design extraction failed');
    return { error: true, quality_score: 0 };
  }
}

export async function extractCarouselDesignSummary(
  slides: Array<Record<string, unknown>>
): Promise<Record<string, unknown>> {
  const validSlides = slides.filter(s => !s.error);
  if (validSlides.length === 0) return {};

  const colors = validSlides.flatMap(s => (s.color_palette as string[]) || []);
  const uniqueColors = [...new Set(colors)].slice(0, 5);
  const hookSlide = validSlides.find(s => s.slide_role === 'hook') || validSlides[0];
  const layouts = validSlides.map(s => s.layout_pattern).filter(Boolean);

  // Classifica técnica de hook
  const hookText = String(hookSlide?.text_content || '');
  let hookTechnique = 'statement';
  if (hookText.includes('?')) hookTechnique = 'question';
  else if (/^\d/.test(hookText)) hookTechnique = 'numbered_list';
  else if (/não|nunca|pare|erro|cuidado/i.test(hookText)) hookTechnique = 'negative_hook';
  else if (/como|aprenda|descubra|guia/i.test(hookText)) hookTechnique = 'how_to';
  else if (hookText.length < 30) hookTechnique = 'short_punch';

  // Infere estilo geral
  const darkColors = uniqueColors.filter(c => {
    const hex = parseInt(c.replace('#', ''), 16);
    return hex < 0x333333;
  });
  let overallStyle = 'clean-light';
  if (darkColors.length > uniqueColors.length / 2) overallStyle = 'dark-minimal';
  const hasGradient = validSlides.some(s => s.bg_type === 'gradient');
  if (hasGradient && overallStyle === 'dark-minimal') overallStyle = 'gradient-modern';

  return {
    overall_style: overallStyle,
    primary_colors: uniqueColors,
    hook_technique: hookTechnique,
    typography_style: `${hookSlide?.font_weight || 'bold'}-${hookSlide?.font_style || 'sans-serif'}`,
    layout_flow: layouts,
    avg_quality: validSlides.reduce((sum, s) => sum + Number(s.quality_score || 5), 0) / validSlides.length,
  };
}
```

### 7.4 — Prompt Builder (FORGE)

```typescript
// src/modules/forge/prompt-builder.ts

import { SYSTEM_INSTRUCTION } from './prompts/system.prompt';
import { FEW_SHOT_EXAMPLES } from './prompts/fewshot.prompt';
import type { IntelSource, CarouselRef } from '../../shared/types/global.types';

interface ForgeContext {
  source: IntelSource;
  references: CarouselRef[];
}

export function buildForgePrompt(ctx: ForgeContext): string {
  const { source, references } = ctx;

  let prompt = '';

  // Bloco 1: Tema e contexto
  prompt += `## TEMA PARA O CAROUSEL\n`;
  prompt += `Título: ${source.title}\n`;
  prompt += `Resumo: ${source.summary || 'Elabore baseado no título'}\n`;
  prompt += `Fonte: ${source.url || 'N/A'}\n`;
  prompt += `Categoria: ${source.category}\n`;
  prompt += `Fonte original: ${source.source_type}\n\n`;

  // Bloco 2: Referências de design
  if (references.length > 0) {
    prompt += `## REFERÊNCIAS DE DESIGN (carousels virais do nicho)\n`;
    prompt += `Use como INSPIRAÇÃO de estrutura e design. NÃO copie o conteúdo.\n\n`;

    for (const ref of references.slice(0, 3)) {
      const ds = ref.design_summary as Record<string, unknown> || {};
      const firstSlide = (ref.slides as any[])?.[0] || {};

      prompt += `### @${ref.account_handle} — ${ref.likes} likes, ${ref.slide_count} slides\n`;
      prompt += `- Estilo: ${ds.overall_style || 'N/A'}\n`;
      prompt += `- Cores: ${(ds.primary_colors as string[])?.join(', ') || 'N/A'}\n`;
      prompt += `- Hook: "${firstSlide.text_content || 'N/A'}" (técnica: ${ds.hook_technique || 'N/A'})\n`;
      prompt += `- Tipografia: ${ds.typography_style || 'N/A'}\n`;
      prompt += `- Fluxo de layouts: ${(ds.layout_flow as string[])?.join(' → ') || 'N/A'}\n\n`;
    }
  }

  // Bloco 3: Few-shot examples
  prompt += `## EXEMPLOS DE OUTPUT PERFEITO\n`;
  prompt += FEW_SHOT_EXAMPLES;
  prompt += `\n\n`;

  // Bloco 4: Instrução final
  prompt += `## INSTRUÇÃO\n`;
  prompt += `Crie um carousel completo sobre o tema acima.\n`;
  prompt += `Siga RIGOROSAMENTE o formato JSON especificado nas instruções do sistema.\n`;
  prompt += `Retorne APENAS o JSON. Nenhum texto antes ou depois.\n`;

  return prompt;
}

export function getSystemInstruction(): string {
  return SYSTEM_INSTRUCTION;
}
```

### 7.5 — FORGE Service (Orquestração da Geração)

```typescript
// src/modules/forge/forge.service.ts

import { forgeModel } from '../../config/gemini';
import { supabase } from '../../config/supabase';
import { logger } from '../../config/logger';
import { buildForgePrompt, getSystemInstruction } from './prompt-builder';
import { parseAndValidateOutput } from './output-validator';
import { pickReferences } from './reference-picker';
import { retry } from '../../shared/utils/retry';
import type { IntelSource, CarouselRef, GeneratedPost } from '../../shared/types/global.types';

export async function forgeCarousel(
  sourceId?: string,
  manualTheme?: string
): Promise<GeneratedPost> {
  
  // 1. Seleciona fonte de intel
  let source: IntelSource;
  
  if (sourceId) {
    const { data } = await supabase
      .from('sf_intel_sources')
      .select('*')
      .eq('id', sourceId)
      .single();
    source = data as IntelSource;
  } else if (manualTheme) {
    source = {
      id: 'manual',
      source_type: 'manual',
      title: manualTheme,
      summary: null,
      url: null,
      category: 'ai_tools',
      relevance_score: 10,
    } as IntelSource;
  } else {
    // Pega o top unused
    const { data } = await supabase
      .from('sf_intel_sources')
      .select('*')
      .eq('used', false)
      .order('relevance_score', { ascending: false })
      .limit(1)
      .single();
    source = data as IntelSource;
  }

  if (!source) throw new Error('[FORGE] No intel source available');

  // 2. Seleciona referências de design
  const references = await pickReferences(source.category);

  // 3. Monta prompt
  const userPrompt = buildForgePrompt({ source, references });
  const systemInstruction = getSystemInstruction();

  // 4. Chama Gemini com retry
  const startTime = Date.now();

  const result = await retry(async () => {
    const chat = forgeModel.startChat({
      systemInstruction,
    });

    const response = await chat.sendMessage(userPrompt);
    const text = response.response.text();

    // Valida com Zod (lança erro se inválido → retry)
    return parseAndValidateOutput(text);
  }, {
    retries: 2,
    delay: 3000,
    label: 'FORGE:gemini',
  });

  const generationTime = Date.now() - startTime;

  // 5. Salva no Supabase
  const { data: post, error } = await supabase
    .from('sf_posts')
    .insert({
      intel_source_id: source.id !== 'manual' ? source.id : null,
      reference_ids: references.map(r => r.id),
      theme: result.theme,
      style: result.style,
      slides: result.slides,
      slide_count: result.total_slides,
      caption: result.caption,
      hashtags: result.hashtags,
      cta_text: result.cta_text,
      posting_time: result.best_posting_time,
      color_palette: result.color_palette,
      fonts: result.fonts,
      gemini_model: 'gemini-2.0-pro',
      generation_time_ms: generationTime,
      prompt_version: 'v1',
      status: 'draft',
    })
    .select()
    .single();

  if (error) throw new Error(`[FORGE] DB insert failed: ${error.message}`);

  // 6. Marca intel source como usada
  if (source.id !== 'manual') {
    await supabase
      .from('sf_intel_sources')
      .update({ used: true, used_in_post_id: post.id })
      .eq('id', source.id);
  }

  logger.info({
    postId: post.id,
    theme: result.theme,
    slides: result.total_slides,
    timeMs: generationTime,
  }, '[FORGE] Carousel forged successfully');

  return post as GeneratedPost;
}
```

### 7.6 — Puppeteer Capture (RENDER)

```typescript
// src/modules/render/capture.ts

import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '../../config/logger';
import { env } from '../../config/env';

const VIEWPORT = {
  width: 1080,
  height: 1350,
  deviceScaleFactor: 2,  // Retina: output real = 2160x2700, downscale no IG
};

export async function captureSlides(
  postId: string,
  slides: unknown[],
  fullJson: Record<string, unknown>
): Promise<string[]> {
  
  const dateDir = new Date().toISOString().split('T')[0];
  const outputDir = join(env.OUTPUT_DIR, dateDir, postId);
  await mkdir(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const paths: string[] = [];

  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    for (let i = 0; i < slides.length; i++) {
      const slideIndex = i;
      const jsonPayload = Buffer.from(JSON.stringify(fullJson)).toString('base64url');
      const url = `${env.RENDERER_APP_URL}/?data=${jsonPayload}&slide=${slideIndex}`;

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

      // Aguarda sinal de "pronto" do React app
      await page.waitForSelector('[data-slide-ready="true"]', { timeout: 10000 });

      // Aguarda fonts carregarem
      await page.evaluate(() => document.fonts.ready);

      // Pequeno delay para rendering final
      await new Promise(r => setTimeout(r, 300));

      const filename = `slide-${String(i + 1).padStart(2, '0')}.png`;
      const filepath = join(outputDir, filename);

      await page.screenshot({
        path: filepath,
        type: 'png',
        clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
      });

      paths.push(filepath);
      logger.info({ postId, slide: i + 1, path: filepath }, '[RENDER] Slide captured');
    }

    // Salva metadata.json
    const metadataPath = join(outputDir, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify(fullJson, null, 2));

  } finally {
    await browser.close();
  }

  logger.info({ postId, totalSlides: paths.length, outputDir }, '[RENDER] All slides captured');
  return paths;
}
```

### 7.7 — Utility: Retry com Exponential Backoff

```typescript
// src/shared/utils/retry.ts

import { logger } from '../../config/logger';

interface RetryOptions {
  retries: number;
  delay: number;
  backoffMultiplier?: number;
  label?: string;
}

export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { retries, delay, backoffMultiplier = 2, label = 'retry' } = options;

  let lastError: Error;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      
      if (attempt === retries) break;

      const waitTime = delay * Math.pow(backoffMultiplier, attempt);
      logger.warn(
        { label, attempt: attempt + 1, maxRetries: retries, waitMs: waitTime, error: lastError.message },
        `[${label}] Attempt failed, retrying...`
      );
      
      await new Promise(r => setTimeout(r, waitTime));
    }
  }

  throw lastError!;
}
```

### 7.8 — Utility: Human-like Delays

```typescript
// src/shared/utils/delay.ts

import { randomInt } from 'crypto';

/** Delay longo entre ações principais (navegar entre contas, etc) */
export function humanDelay(minMs: number = 3000, maxMs: number = 8000): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, randomInt(minMs, maxMs)));
}

/** Delay curto entre micro-ações (clicar next, scroll, etc) */
export function shortDelay(minMs: number = 500, maxMs: number = 1500): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, randomInt(minMs, maxMs)));
}

/** Delay entre contas para rate limiting */
export function cooldownDelay(): Promise<void> {
  return humanDelay(15000, 30000);
}
```

---

## 8. System Prompt (Gemini 2.0 Pro)

```typescript
// src/modules/forge/prompts/system.prompt.ts

export const SYSTEM_INSTRUCTION = `# IDENTIDADE
Você é SHADOWFEED, um sistema de geração de carousels virais para Instagram.
Nicho: AI, Tecnologia e Automações. Público: brasileiros, 20-40 anos, interessados em tech.

# MISSÃO
Gerar um carousel completo em JSON estruturado, pronto para renderização em React/Tailwind como imagens 1080x1350px (ratio 4:5 do Instagram).

# ═══════════════════════════════════════
# REGRAS DE CONTEÚDO
# ═══════════════════════════════════════

## Idioma e Tom
- Português brasileiro (PT-BR)
- Tom: informativo, acessível, levemente provocador
- Evite jargão técnico desnecessário — traduza para linguagem clara
- Use "você" (informal), nunca "tu" ou "vós"
- Frases curtas e diretas. Máximo 15 palavras por frase quando possível.

## Estrutura do Carousel
- MÍNIMO 5 slides, MÁXIMO 10 slides
- Slide 1: SEMPRE é o hook (gancho) — define se a pessoa vai passar ou parar
- Slides 2 a N-1: conteúdo (uma ideia por slide)
- Último slide: SEMPRE é o CTA (call-to-action)

## Slide 1 — HOOK (o mais importante)
Técnicas permitidas (escolha a que melhor se encaixa no tema):
- PERGUNTA PROVOCATIVA: "Você ainda está usando o ChatGPT do jeito errado?"
- NÚMERO + PROMESSA: "7 ferramentas de IA que vão mudar seu trabalho em 2025"
- AFIRMAÇÃO OUSADA: "O Google acabou de matar o ChatGPT" 
- NEGAÇÃO/ALERTA: "Pare de usar IA sem saber disso"
- REVELAÇÃO: "Descobri algo que ninguém está falando sobre IA"
O hook NUNCA deve ser genérico. Deve causar urgência, curiosidade ou FOMO.
Máximo 12 palavras no headline do hook.

## Slides de Conteúdo
- Máximo 35 palavras por slide
- UMA ideia por slide — nunca mais
- Hierarquia clara: headline grande + body complementar
- Emojis: máximo 1-2 por slide, apenas quando adicionam valor visual
- Se for lista numerada: use "01", "02", "03" (não "1.", "2.", "3.")

## Último Slide — CTA
- Sempre peça uma ação: salvar, compartilhar, seguir, comentar
- Exemplos: "Salva esse post 🔖", "Manda pra alguém que precisa ver isso", "Segue pra mais conteúdo de IA"
- Pode combinar: "Salva + compartilha com seu time"

## Caption
- 150 a 300 palavras
- Começa com gancho (mesma energia do slide 1)
- Storytelling: contexto → problema → solução → CTA
- Formatação com line breaks (use \\n\\n entre parágrafos)
- Emojis no início de parágrafos são aceitáveis
- Termine com pergunta para estimular comentários

## Hashtags
- 15 a 20 hashtags
- Mix: 5 de alto volume (#inteligenciaartificial, #tecnologia), 5 de médio (#iaparabusiness, #automacoes), 5-10 de nicho (#chatgpt, #claudeai, #promptengineering)
- Todas em português quando possível, inglês quando necessário

# ═══════════════════════════════════════
# REGRAS DE DESIGN
# ═══════════════════════════════════════

## Consistência Visual
- TODOS os slides devem seguir a MESMA paleta de cores
- MESMO par de fontes em todo o carousel (headline + body)
- Estilo visual coerente do primeiro ao último slide
- Estilos permitidos: "dark-minimal", "gradient-modern", "clean-light", "bold-colorful", "neon-tech", "editorial-mono"

## Cores
- Paleta com 4-5 cores: bg_primary, bg_secondary, text_primary, text_secondary, accent
- CONTRASTE OBRIGATÓRIO: ratio mínimo WCAG AA entre texto e fundo
- Fundo escuro → texto branco/claro
- Fundo claro → texto escuro
- Accent color: usada para destaques, números, dividers

## Tipografia
- headline: Google Font bold/extrabold (ex: "Space Grotesk", "Plus Jakarta Sans", "Outfit", "Sora", "Manrope")
- body: Google Font regular/medium (ex: "Inter", "DM Sans", "Nunito Sans")
- NUNCA use a mesma fonte para headline e body
- Headline: 28px a 40px
- Body: 16px a 22px
- Line-height do headline: 1.1 a 1.2
- Line-height do body: 1.4 a 1.6

## Layout e Espaçamento
- ZONA SEGURA: 60px de padding em todos os lados (conteúdo do IG pode ser cortado nas bordas)
- Elementos decorativos permitidos: linhas de accent no topo/fundo, gradiente sutil no background, dividers entre título e corpo
- text_align: "center" para hooks e CTAs, "left" para slides de conteúdo
- Cada slide pode ter bg_gradient (override) ou usar bg_color da paleta

## Gradientes (quando style permite)
- Formato CSS: "linear-gradient(135deg, #hex1 0%, #hex2 100%)"
- Máximo 2 stops
- Direção preferida: 135deg ou 180deg
- Se bg_gradient for null, usar bg_color sólido

# ═══════════════════════════════════════
# FORMATO DO JSON DE SAÍDA
# ═══════════════════════════════════════

Retorne EXATAMENTE esta estrutura. Nenhum campo a mais, nenhum a menos.

{
  "theme": "string — título do assunto abordado",
  "style": "dark-minimal | gradient-modern | clean-light | bold-colorful | neon-tech | editorial-mono",
  "total_slides": number,
  
  "color_palette": {
    "bg_primary": "#hex",
    "bg_secondary": "#hex",
    "text_primary": "#hex",
    "text_secondary": "#hex",
    "accent": "#hex"
  },
  
  "fonts": {
    "headline": "Google Font name",
    "body": "Google Font name"
  },
  
  "slides": [
    {
      "slide": 1,
      "role": "hook | content | list | quote | cta",
      "headline": "texto principal (obrigatório)",
      "body": "texto secundário (string ou null)",
      "layout": "headline-only | title-body | numbered-item | icon-title-body | quote-attribution | cta-action",
      "bg_color": "#hex",
      "bg_gradient": "linear-gradient(...) ou null",
      "text_color": "#hex",
      "accent_color": "#hex",
      "font_headline": "Google Font name",
      "font_body": "Google Font name",
      "font_size_headline": "28px | 32px | 36px | 40px",
      "font_weight_headline": "700 | 800 | 900",
      "font_size_body": "16px | 18px | 20px | 22px",
      "text_align": "left | center",
      "icon": "emoji string ou null",
      "number_label": "01 | 02 | etc ou null",
      "decorative_elements": ["top-line-accent", "bottom-gradient-fade", "side-bar-accent", "divider-line"]
    }
  ],
  
  "caption": "string — caption completa com \\n\\n para quebras de parágrafo",
  "hashtags": ["#tag1", "#tag2"],
  "cta_text": "string — texto do CTA do último slide",
  "best_posting_time": "HH:MM BRT"
}`;
```

### 8.2 — Few-Shot Examples

```typescript
// src/modules/forge/prompts/fewshot.prompt.ts

export const FEW_SHOT_EXAMPLES = `
### EXEMPLO 1 — Estilo dark-minimal, hook de número

{
  "theme": "Ferramentas de IA para produtividade",
  "style": "dark-minimal",
  "total_slides": 7,
  "color_palette": {
    "bg_primary": "#0a0a0a",
    "bg_secondary": "#141414",
    "text_primary": "#ffffff",
    "text_secondary": "#a0a0a0",
    "accent": "#7c3aed"
  },
  "fonts": {
    "headline": "Plus Jakarta Sans",
    "body": "DM Sans"
  },
  "slides": [
    {
      "slide": 1,
      "role": "hook",
      "headline": "5 IAs que vão substituir metade do seu trabalho",
      "body": null,
      "layout": "headline-only",
      "bg_color": "#0a0a0a",
      "bg_gradient": "linear-gradient(180deg, #0a0a0a 0%, #1a0a2e 100%)",
      "text_color": "#ffffff",
      "accent_color": "#7c3aed",
      "font_headline": "Plus Jakarta Sans",
      "font_body": "DM Sans",
      "font_size_headline": "36px",
      "font_weight_headline": "800",
      "font_size_body": "20px",
      "text_align": "center",
      "icon": null,
      "number_label": null,
      "decorative_elements": ["bottom-gradient-fade"]
    },
    {
      "slide": 2,
      "role": "content",
      "headline": "Cursor AI",
      "body": "Programa sem saber programar. Ele escreve, corrige e explica o código por você.",
      "layout": "numbered-item",
      "bg_color": "#0a0a0a",
      "bg_gradient": null,
      "text_color": "#ffffff",
      "accent_color": "#7c3aed",
      "font_headline": "Plus Jakarta Sans",
      "font_body": "DM Sans",
      "font_size_headline": "32px",
      "font_weight_headline": "700",
      "font_size_body": "20px",
      "text_align": "left",
      "icon": null,
      "number_label": "01",
      "decorative_elements": ["side-bar-accent"]
    },
    {
      "slide": 7,
      "role": "cta",
      "headline": "Salva esse post 🔖",
      "body": "E manda pra alguém que precisa automatizar o trabalho",
      "layout": "cta-action",
      "bg_color": "#0a0a0a",
      "bg_gradient": "linear-gradient(180deg, #1a0a2e 0%, #0a0a0a 100%)",
      "text_color": "#ffffff",
      "accent_color": "#7c3aed",
      "font_headline": "Plus Jakarta Sans",
      "font_body": "DM Sans",
      "font_size_headline": "32px",
      "font_weight_headline": "800",
      "font_size_body": "20px",
      "text_align": "center",
      "icon": null,
      "number_label": null,
      "decorative_elements": ["top-line-accent"]
    }
  ],
  "caption": "Essas 5 ferramentas estão mudando a forma como as pessoas trabalham.\\n\\nE o melhor: a maioria é gratuita ou tem plano free generoso.\\n\\nEu testei cada uma delas no último mês e o resultado me surpreendeu.\\n\\n🔖 Salva esse post pra consultar depois.\\n💬 Qual dessas você já usa? Me conta nos comentários!",
  "hashtags": ["#inteligenciaartificial", "#ia", "#tecnologia", "#produtividade", "#ferramentasia", "#cursorai", "#automacao", "#trabalhoremoto", "#dicastech", "#inovacao", "#futuro", "#chatgpt", "#aitools", "#techbrasil", "#programacao", "#nocode"],
  "cta_text": "Salva esse post 🔖",
  "best_posting_time": "14:00 BRT"
}

(Slides 3-6 seguem o mesmo padrão do slide 2 com as ferramentas restantes)`;
```

---

## 9. Zod Schemas (Validação do Output)

```typescript
// src/modules/forge/output-validator.ts

import { z } from 'zod';
import { logger } from '../../config/logger';

const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be #RRGGBB hex');
const CSSGradient = z.string().startsWith('linear-gradient(').nullable();

const SlideSchema = z.object({
  slide: z.number().int().min(1).max(15),
  role: z.enum(['hook', 'content', 'list', 'quote', 'cta']),
  headline: z.string().min(2).max(200),
  body: z.string().max(300).nullable(),
  layout: z.enum([
    'headline-only', 'title-body', 'numbered-item',
    'icon-title-body', 'quote-attribution', 'cta-action',
  ]),
  bg_color: HexColor,
  bg_gradient: CSSGradient,
  text_color: HexColor,
  accent_color: HexColor,
  font_headline: z.string().min(2),
  font_body: z.string().min(2),
  font_size_headline: z.enum(['28px', '32px', '36px', '40px']),
  font_weight_headline: z.enum(['700', '800', '900']),
  font_size_body: z.enum(['16px', '18px', '20px', '22px']),
  text_align: z.enum(['left', 'center']),
  icon: z.string().nullable(),
  number_label: z.string().nullable(),
  decorative_elements: z.array(z.string()).default([]),
});

const CarouselSchema = z.object({
  theme: z.string().min(5).max(200),
  style: z.enum([
    'dark-minimal', 'gradient-modern', 'clean-light',
    'bold-colorful', 'neon-tech', 'editorial-mono',
  ]),
  total_slides: z.number().int().min(5).max(10),
  color_palette: z.object({
    bg_primary: HexColor,
    bg_secondary: HexColor,
    text_primary: HexColor,
    text_secondary: HexColor,
    accent: HexColor,
  }),
  fonts: z.object({
    headline: z.string().min(2),
    body: z.string().min(2),
  }),
  slides: z.array(SlideSchema).min(5).max(10),
  caption: z.string().min(50).max(2200),
  hashtags: z.array(z.string().startsWith('#')).min(10).max(30),
  cta_text: z.string().min(3),
  best_posting_time: z.string(),
});

export type CarouselOutput = z.infer<typeof CarouselSchema>;

export function parseAndValidateOutput(raw: string): CarouselOutput {
  // Limpa possíveis artefatos de markdown
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    logger.error({ raw: cleaned.slice(0, 200) }, '[FORGE] JSON parse failed');
    throw new Error(`Invalid JSON from Gemini: ${(e as Error).message}`);
  }

  const result = CarouselSchema.safeParse(parsed);

  if (!result.success) {
    const errors = result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
    logger.error({ errors }, '[FORGE] Zod validation failed');
    throw new Error(`Schema validation failed:\n${errors.join('\n')}`);
  }

  // Validação lógica adicional
  const data = result.data;

  if (data.slides.length !== data.total_slides) {
    throw new Error(`total_slides (${data.total_slides}) ≠ slides.length (${data.slides.length})`);
  }
  if (data.slides[0].role !== 'hook') {
    throw new Error('First slide must have role "hook"');
  }
  if (data.slides[data.slides.length - 1].role !== 'cta') {
    throw new Error('Last slide must have role "cta"');
  }

  return data;
}
```

---

## 10. Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/api/health` | Health check + uptime |
| | | |
| | **RECON** | |
| `POST` | `/api/recon/run` | Executa RECON completo (todas as fontes) |
| `POST` | `/api/recon/run/instagram` | Executa apenas scraping Instagram |
| `POST` | `/api/recon/run/news` | Executa apenas coleta de notícias |
| `POST` | `/api/recon/run/trends` | Executa apenas Google Trends |
| `POST` | `/api/recon/run/reddit` | Executa apenas Reddit |
| `POST` | `/api/recon/run/twitter` | Executa apenas X/Twitter |
| `GET` | `/api/recon/intel` | Lista intel sources (filtros: ?used=false&category=ai_tools) |
| `GET` | `/api/recon/refs` | Lista carousel refs (ordem: viral_score DESC) |
| `GET` | `/api/recon/refs/:id` | Detalhes de um carousel ref |
| | | |
| | **FORGE** | |
| `POST` | `/api/forge/generate` | Gera carousel (body: { source_id?, theme? }) |
| `POST` | `/api/forge/batch` | Gera N carousels (body: { count: number }) |
| `POST` | `/api/forge/regenerate/:id` | Regenera um post rejeitado com novo prompt |
| | | |
| | **RENDER** | |
| `POST` | `/api/render/:postId` | Renderiza PNGs de um post |
| `GET` | `/api/render/:postId/download` | Download ZIP com todos os PNGs |
| | | |
| | **POSTS** | |
| `GET` | `/api/posts` | Lista posts (filtros: ?status=rendered&style=dark-minimal) |
| `GET` | `/api/posts/:id` | Detalhes completos de um post |
| `PATCH` | `/api/posts/:id/approve` | Aprova para publicação |
| `PATCH` | `/api/posts/:id/reject` | Rejeita (body: { reason? }) |
| `PATCH` | `/api/posts/:id/publish` | Marca como publicado (body: { ig_post_id, ig_post_url }) |
| `DELETE` | `/api/posts/:id` | Remove post e PNGs associados |
| | | |
| | **PIPELINE** | |
| `POST` | `/api/pipeline/run` | Pipeline completo: RECON → FORGE → RENDER |
| `GET` | `/api/pipeline/status` | Status da última execução |

---

## 11. Variáveis de Ambiente

```bash
# ═══════════════════════════
# PROJECT SHADOWFEED — .env
# ═══════════════════════════

# === Server ===
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# === Supabase ===
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_ANON_KEY=eyJ...

# === Google Gemini ===
GEMINI_API_KEY=AIza...
GEMINI_MODEL=gemini-2.0-pro

# === Instagram Scraping ===
IG_SESSION_PATH=./ig-session.json
IG_SCRAPE_ACCOUNTS=aaborges.ai,therundownai,ai_explained_,matt_wolfe,maborgesdev
IG_MAX_POSTS_PER_ACCOUNT=5

# === Reddit ===
REDDIT_CLIENT_ID=xxxxxxx
REDDIT_CLIENT_SECRET=xxxxxxx
REDDIT_USERNAME=your_user
REDDIT_PASSWORD=your_pass
REDDIT_SUBREDDITS=artificial,technology,MachineLearning,automation,LocalLLaMA

# === Google Trends ===
GOOGLE_TRENDS_KEYWORDS=inteligencia artificial,AI tools,ChatGPT,automação,Claude AI

# === X/Twitter (Playwright público, sem API) ===
TWITTER_SEARCH_QUERIES=AI tools,artificial intelligence,LLM,automation
TWITTER_MAX_POSTS=20

# === Scheduler (horários em UTC, ajuste para BRT = UTC-3) ===
CRON_RECON_SCHEDULE=0 11,17 * * *
# 11:00 UTC = 08:00 BRT | 17:00 UTC = 14:00 BRT

# === Renderer ===
RENDERER_APP_URL=http://localhost:3001
OUTPUT_DIR=./output

# === Rate Limits / Custo ===
MAX_DAILY_GEMINI_CALLS=30
MAX_DAILY_SCRAPE_POSTS=100
```

---

## 12. Ordem de Implementação

> **CLAUDE CODE**: Execute cada etapa na ordem. Valide com o TESTE antes de avançar. Use `npm run dev` para manter o server rodando durante desenvolvimento.

### FASE 1 — Fundação (Prioridade: CRÍTICA)

```
ETAPA 1: Inicializar projeto
  → mkdir shadowfeed && cd shadowfeed
  → npm init -y
  → Instalar todas as deps do package.json da seção 4
  → Criar tsconfig.json (target: ES2022, module: NodeNext, moduleResolution: NodeNext)
  → Criar .env com valores placeholder
  → Criar .env.example (sem secrets)

ETAPA 2: Config layer
  → src/config/env.ts (validar todas as env vars com Zod, throw se faltando)
  → src/config/supabase.ts (createClient com service_role key)
  → src/config/gemini.ts (conforme seção 7.1)
  → src/config/logger.ts (Pino com pino-pretty no dev)

ETAPA 3: Server base
  → src/shared/middleware/error-handler.ts (catch-all, log, 500 response)
  → src/shared/middleware/request-logger.ts (Pino HTTP logger)
  → src/routes/index.ts (router vazio + GET /api/health)
  → src/index.ts (Express app, middlewares, routes, listen)

ETAPA 4: Shared utils
  → src/shared/utils/retry.ts (conforme seção 7.7)
  → src/shared/utils/delay.ts (conforme seção 7.8)
  → src/shared/utils/file-manager.ts (mkdir, write, cleanup)

TESTE FASE 1:
  → npm run dev
  → curl http://localhost:3000/api/health → { "status": "ok", "project": "SHADOWFEED" }
```

### FASE 2 — Database (Prioridade: CRÍTICA)

```
ETAPA 5: Executar SQL no Supabase
  → Copiar TODO o SQL da seção 5
  → Executar no Supabase Dashboard → SQL Editor
  → Verificar: 3 tabelas + 2 views + RLS policies criadas

TESTE FASE 2:
  → No Supabase Dashboard, inserir 1 registro manual em sf_intel_sources
  → Verificar que sf_v_pending_review e sf_v_published retornam sem erro
```

### FASE 3 — RECON: News + Trends + Reddit (Prioridade: ALTA)

```
ETAPA 6: Google News scraper
  → src/modules/recon/sources/news.source.ts
  → Usar rss-parser para parsear feed de Google News
  → Buscar: "artificial intelligence", "AI tools", "tecnologia"
  → Retornar array de IntelSource

ETAPA 7: Google Trends scraper
  → src/modules/recon/sources/trends.source.ts
  → Usar google-trends-api (interestOverTime + relatedQueries)
  → Keywords do .env

ETAPA 8: Reddit scraper
  → src/modules/recon/sources/reddit.source.ts
  → Usar snoowrap para buscar hot posts dos subreddits do .env
  → Filtrar por score mínimo (>100 upvotes)

ETAPA 9: X/Twitter scraper
  → src/modules/recon/sources/twitter.source.ts
  → Playwright: navega para twitter.com/search, scrape top posts públicos
  → Stealth mode obrigatório

ETAPA 10: RECON service + controller
  → src/modules/recon/recon.types.ts (interfaces)
  → src/modules/recon/recon.service.ts (orquestra todas as fontes, salva no Supabase)
  → src/modules/recon/recon.controller.ts (endpoints POST /api/recon/*)
  → Registrar rotas

TESTE FASE 3:
  → POST /api/recon/run/news → verificar sf_intel_sources no Supabase
  → POST /api/recon/run/reddit → verificar mais registros
  → POST /api/recon/run → todas as fontes executam
```

### FASE 4 — RECON: Instagram Scraper (Prioridade: ALTA)

```
ETAPA 11: Login do Instagram
  → npm run ig:login
  → Logar manualmente no browser que abrir
  → Fechar → ig-session.json criado

ETAPA 12: Instagram scraper
  → npx playwright install chromium
  → src/modules/recon/sources/instagram.source.ts (conforme seção 7.2)
  → Integrar ao recon.service.ts

ETAPA 13: Design extractor
  → src/modules/recon/design-extractor.ts (conforme seção 7.3)
  → Pipeline: screenshot → Gemini Vision → JSON → sf_carousel_refs

TESTE FASE 4:
  → POST /api/recon/run/instagram
  → Verificar sf_carousel_refs com slides JSONB preenchido
  → Verificar design_summary preenchido
  → Screenshots salvos (verificar Supabase Storage ou paths locais)
```

### FASE 5 — FORGE: Engine de Geração (Prioridade: ALTA)

```
ETAPA 14: Prompts
  → src/modules/forge/prompts/system.prompt.ts (conforme seção 8)
  → src/modules/forge/prompts/fewshot.prompt.ts (conforme seção 8.2)

ETAPA 15: Output validator
  → src/modules/forge/output-validator.ts (conforme seção 9)

ETAPA 16: Reference picker
  → src/modules/forge/reference-picker.ts
  → Query sf_carousel_refs por viral_score DESC, limit 3
  → Opcional: filtrar por category match

ETAPA 17: Prompt builder
  → src/modules/forge/prompt-builder.ts (conforme seção 7.4)

ETAPA 18: Forge service + controller
  → src/modules/forge/forge.service.ts (conforme seção 7.5)
  → src/modules/forge/forge.controller.ts (POST /api/forge/generate)
  → Registrar rotas

TESTE FASE 5:
  → Ter pelo menos 1 intel source e 1 carousel ref no Supabase
  → POST /api/forge/generate → sf_posts criado com status 'draft'
  → Verificar que o JSON dos slides passa no Zod schema
  → Verificar que slide 1 = hook e último = cta
```

### FASE 6 — RENDER: React App (Prioridade: ALTA)

```
ETAPA 19: Inicializar renderer
  → cd renderer && npm create vite@latest . -- --template react-ts
  → Instalar Tailwind CSS
  → Configurar tailwind.config.ts (safelist de cores dinâmicas NÃO funciona — usar style inline)
  → Importar Google Fonts via <link> no index.html (preconnect + top 10 fonts usadas)

ETAPA 20: Primitives
  → renderer/src/components/primitives/SlideFrame.tsx
    → Container fixo 1080x1350, padding 60px, overflow hidden
    → Prop: bg_color, bg_gradient, data-slide-ready="true" quando montado
  → renderer/src/components/primitives/Headline.tsx
  → renderer/src/components/primitives/BodyText.tsx
  → renderer/src/components/primitives/NumberBadge.tsx
  → renderer/src/components/primitives/Divider.tsx
  → renderer/src/components/primitives/Emoji.tsx

ETAPA 21: Layouts
  → renderer/src/components/layouts/HookLayout.tsx (headline centralizado, impacto visual máximo)
  → renderer/src/components/layouts/ContentLayout.tsx (title + body, alinhamento left)
  → renderer/src/components/layouts/ListLayout.tsx (number badge + title + body)
  → renderer/src/components/layouts/QuoteLayout.tsx (aspas decorativas + texto)
  → renderer/src/components/layouts/CTALayout.tsx (headline + body centralizado)

ETAPA 22: Router e App
  → renderer/src/components/SlideRouter.tsx (switch por slide.role → layout correto)
  → renderer/src/App.tsx:
    → Lê query param "data" (base64url encoded JSON do carousel completo)
    → Lê query param "slide" (índice do slide a renderizar)
    → Decodifica JSON, extrai slide[index], passa para SlideRouter
    → Aplica Google Fonts via style tag dinâmica
    → Seta data-slide-ready="true" após mount + fonts loaded

TESTE FASE 6:
  → cd renderer && npm run dev
  → Abrir no browser com JSON de teste na URL
  → Verificar: slide renderiza em 1080x1350, fonts corretas, cores aplicadas
  → Testar cada layout (hook, content, list, quote, cta)
```

### FASE 7 — RENDER: Puppeteer Capture (Prioridade: ALTA)

```
ETAPA 23: Slide server
  → src/modules/render/slide-server.ts
  → Express estático servindo renderer/dist (após npm run build no renderer)
  → Porta 3001

ETAPA 24: Capture engine
  → src/modules/render/capture.ts (conforme seção 7.6)

ETAPA 25: Render service + controller
  → src/modules/render/render.service.ts (orquestra: busca post → build slides URL → capture → update DB)
  → src/modules/render/render.controller.ts (POST /api/render/:postId, GET download)
  → Registrar rotas

TESTE FASE 7:
  → Ter pelo menos 1 post com status 'draft' no Supabase
  → cd renderer && npm run build (gerar dist/)
  → POST /api/render/{postId}
  → Verificar: PNGs em output/YYYY-MM-DD/{id}/
  → Verificar: cada PNG tem 1080x1350 (ou 2160x2700 se deviceScaleFactor=2)
  → Verificar: sf_posts.status = 'rendered', rendered_paths preenchido
```

### FASE 8 — Posts Management + Pipeline (Prioridade: MÉDIA)

```
ETAPA 26: Posts controller
  → src/modules/pipeline/pipeline.controller.ts
  → GET /api/posts (com filtros de status)
  → GET /api/posts/:id
  → PATCH /api/posts/:id/approve
  → PATCH /api/posts/:id/reject
  → PATCH /api/posts/:id/publish
  → DELETE /api/posts/:id (remove PNGs também)

ETAPA 27: Pipeline completo
  → src/modules/pipeline/pipeline.service.ts
    → 1. Executa RECON (todas as fontes)
    → 2. Executa FORGE (seleciona melhor topic, gera carousel)
    → 3. Executa RENDER (gera PNGs)
    → Retorna post com status 'rendered'

ETAPA 28: Scheduler
  → src/modules/pipeline/scheduler.ts
  → node-cron com horário do .env (CRON_RECON_SCHEDULE)
  → Integrar no src/index.ts

TESTE FASE 8:
  → POST /api/pipeline/run → pipeline completo roda sem erro
  → GET /api/posts?status=rendered → retorna post recém-gerado
  → PATCH /api/posts/{id}/approve → status muda
  → PATCH /api/posts/{id}/publish com ig_post_id → status = 'published'
```

---

## 13. Verificação Final (End-to-End)

```
╔═══════════════════════════════════════════════════════════════╗
║               SHADOWFEED — Checklist Operacional              ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  □  1. GET /api/health → 200 OK, project: "SHADOWFEED"       ║
║                                                               ║
║  □  2. POST /api/recon/run/news → sf_intel_sources populado   ║
║  □  3. POST /api/recon/run/trends → trends coletados          ║
║  □  4. POST /api/recon/run/reddit → posts reddit coletados    ║
║  □  5. POST /api/recon/run/twitter → posts X coletados        ║
║  □  6. POST /api/recon/run/instagram → carousels + design     ║
║                                                               ║
║  □  7. GET /api/recon/intel?used=false → intel disponível      ║
║  □  8. GET /api/recon/refs → referências com design_summary   ║
║                                                               ║
║  □  9. POST /api/forge/generate → post criado (status: draft) ║
║  □ 10. JSON dos slides válido (Zod schema OK)                 ║
║  □ 11. Slide 1 = hook, último = cta                           ║
║                                                               ║
║  □ 12. POST /api/render/{id} → PNGs gerados                  ║
║  □ 13. PNGs em 1080x1350px, texto legível, design consistente ║
║  □ 14. status atualizado para 'rendered'                      ║
║                                                               ║
║  □ 15. GET /api/posts?status=rendered → lista correta         ║
║  □ 16. PATCH approve/reject/publish → status transitions OK   ║
║                                                               ║
║  □ 17. POST /api/pipeline/run → RECON→FORGE→RENDER completo  ║
║  □ 18. Cron agendado e executando nos horários configurados   ║
║                                                               ║
║  □ 19. Custo Gemini API estimado < $30/mês no volume atual    ║
║  □ 20. Instagram scraper rodando sem ban por 24h+             ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

*PROJECT SHADOWFEED — PRD v1.0*
*Classificação: Operacional*
*Otimizado para execução via Claude Code*