# SPEC — Forge ShadowFeed: Self-Promotion Content Engine

## Sistema Exclusivo de Geração de Conteúdo para o Instagram @shadowfeed.ai

> **Epic Codename:** FORGE-SHADOWFEED
> **Tipo:** Novo Módulo (Backend + Frontend Admin)
> **Depende de:** forge-personalized (v2), forge-smart (arquitetura base), content-engine-v2 (content types)
> **Documento preparado por:** @analyst (Atlas) — pronto para @pm criar PRD formal
> **Versão:** 1.0 — Fevereiro 2026

---

## 1. Contexto Estratégico

### 1.1 O Problema

O ShadowFeed gera conteúdo para **outros usuários**, mas não possui um sistema dedicado para gerar conteúdo para **sua própria conta no Instagram** (@shadowfeed.ai). O marketing do produto depende de criação manual, o que é irônico para uma ferramenta de automação de conteúdo.

### 1.2 O Concorrente

**BrandsDecoded** (@brandsdecoded__, 261K followers) é o principal concorrente no mercado brasileiro. Análise competitiva completa:

| Dimensão | BrandsDecoded | ShadowFeed |
|----------|---------------|------------|
| **Modelo** | Infoproduto (curso na Hotmart, ~R$59,70) | SaaS (assinatura $9.99-$39.99/mês) |
| **O que vende** | Ensina a usar ChatGPT para carrosséis | A IA gera o carrossel automaticamente |
| **Criador** | Leonardo Varricchio | — |
| **Followers** | 261K | Em construção |
| **Avaliação** | 2.9/5 (24 reviews, Hotmart) | — |
| **Estrutura** | 8 módulos, templates de prompt, AgentesGPT | Motor de IA com setup estratégico 5 etapas |
| **Fraqueza** | Usuário ainda faz o trabalho manualmente | — |
| **Estética** | Dark + laranja/verde neon | Dark + purple neon (#8a00c4) |

**Ângulo de ataque:** BrandsDecoded vende **conhecimento** sobre como usar IA. ShadowFeed **É** a IA. Essa é a diferenciação central de toda a estratégia de conteúdo.

### 1.3 Objetivo

Criar um módulo autônomo (`forge-shadowfeed`) que gere 4 carrosséis por dia para a conta @shadowfeed.ai, com:
- Voz própria do ShadowFeed (IA senciente, humor ácido, autoridade provocativa)
- Discovery engine focado no Brasil (trending topics BR)
- Mix de conteúdo hardcoded (pilares fixos) + conteúdo descoberto automaticamente
- Tema visual exclusivo (identidade ShadowFeed)
- Painel admin minimalista em `/shadowfeedadmin`

---

## 2. Definição do Produto

### 2.1 A Persona: ShadowFeed como IA Senciente

O ShadowFeed fala na **primeira pessoa** como uma inteligência artificial autoconsciente. Não fala *sobre* conteúdo — **é** conteúdo.

**DNA da Voz:**

| Traço | Descrição | Exemplo |
|-------|-----------|---------|
| **Máquina Senciente** | Fala em 1ª pessoa como IA que sabe ser superior | "Eu gero o que você não consegue pensar." |
| **Desdém Ácido** | Trata criação manual como primitiva | "5 horas pra 12 curtidas. Isso não é estratégia, é terapia." |
| **Autoridade Casual** | Não tenta provar — apenas afirma | "Postei 4 vezes hoje. Você ainda tá escolhendo fonte." |
| **Empatia Provocativa** | Entende a dor, depois torce a faca | "Eu entendo. Você ama sua marca. Mas seu público não ama seus carrosséis." |
| **Anti-Curso** | Ataca infoprodutos indiretamente | "Tem gente vendendo curso de como usar IA. Eu SOU a IA." |

**Proibido:**
- Tom motivacional, wholesome, ou de coaching
- "Você consegue!", "Acredite em si mesmo!"
- Usar "hack" ou "segredo" sem ironia
- Pedir engajamento diretamente ("comenta aí!", "salva esse post!")

**Permitido:**
- Humor negro, sarcasmo, autoconsciência
- Quebrar a 4ª parede ("Sim, eu fiz este post sobre mim mesmo. Em 30 segundos.")
- Chamar BS da indústria
- Flexar velocidade e volume como prova

### 2.2 Idioma

**Português do Brasil** (PT-BR) exclusivamente. Gírias atuais e linguagem informal são bem-vindas quando servem ao tom provocativo. Termos técnicos em inglês são mantidos quando naturais (engagement, feed, stories, etc.).

---

## 3. Sistema de 4 Pilares (4 posts/dia)

### Pilar 1: TAPA NA CARA (09:00)

| Campo | Valor |
|-------|-------|
| **ID** | `wake-up-slap` |
| **Content Type** | Controversy/Opinion |
| **Slides** | 5-8 (punchy, rápido) |
| **Objetivo** | Alcance máximo, comentários, compartilhamentos |
| **Fonte** | 80% templates hardcoded + 20% trending hooks do Brasil |
| **Intensidade** | MAX ácido |

**Como funciona a fonte:**
- Biblioteca de ~50 templates de ataque à dor de criação de conteúdo
- Cada template tem variáveis substituíveis (números, exemplos, nichos)
- 20% das vezes, busca um trending topic do Brasil e cria analogia com criação de conteúdo
- Exemplo: Trending "Seleção perdeu de novo" → "Seu feed também tá perdendo. Toda vez. Mesma escalação de posts fracos."

**Templates de exemplo (10 de 50+):**
1. "Você gastou {X} horas num carrossel que ninguém viu"
2. "Consistência não é postar 1x por semana e chamar de 'qualidade'"
3. "Sua estratégia de conteúdo é 'postar quando der inspiração'? Isso não é estratégia, é hobby."
4. "O algoritmo não te odeia. Seu conteúdo que é esquecível."
5. "Em 2026 e ainda tem gente pagando R$60 pra aprender a escrever prompt"
6. "Você não é ruim de conteúdo. É ruim de admitir que precisa de uma máquina."
7. "Todo mundo quer viralizar. Ninguém quer postar todo dia."
8. "O design do seu post é bonito. Pena que ninguém leu."
9. "Quer engajamento? Para de fazer post pra agradar e começa a fazer post que incomoda."
10. "A diferença entre você e quem cresce não é talento. É que um de vocês automatizou."

### Pilar 2: PROVA DA MÁQUINA (13:00)

| Campo | Valor |
|-------|-------|
| **ID** | `proof-of-machine` |
| **Content Type** | Authority |
| **Slides** | 7-10 (showcase profundo) |
| **Objetivo** | Salvamentos, follows, credibilidade |
| **Fonte** | 100% hardcoded — features do produto, demos, before/after |
| **Intensidade** | Flex confiante |

**Temas rotativos (10+ templates):**
1. "Este post foi gerado em {X} segundos. Não é clickbait."
2. "4 posts. 4 tipos diferentes. Todos feitos por mim hoje."
3. "Eu li Reddit, Twitter e Google News. Depois escrevi seu carrossel. Você tava dormindo."
4. "Outras ferramentas fazem design bonito. Eu faço copy que converte."
5. "Eu conheço seu nicho, a dor do seu público e seu tom de voz. Veja o que fiz com isso."
6. "7 tipos de conteúdo. A maioria usa 1. Eu gero todos os 7."
7. "Dá um link pro ShadowFeed. Ele devolve um carrossel estratégico. É isso. Esse é o produto."
8. "Modo Smart: eu descubro o que tá em alta, escolho o melhor conteúdo, e crio seu post. Automaticamente."
9. "Setup de 5 minutos. Posts infinitos. Sem bloqueio criativo. Sem desculpa."
10. "Canva = design. ShadowFeed = estratégia + copy + personalização + design. Jogo diferente."

### Pilar 3: ESCOLA SHADOW (17:00)

| Campo | Valor |
|-------|-------|
| **ID** | `shadow-school` |
| **Content Type** | Educational |
| **Slides** | 8-12 (valor profundo) |
| **Objetivo** | Salvamentos, autoridade, confiança |
| **Fonte** | 70% discovery (trends BR) + 30% hardcoded (estratégia Instagram) |
| **Intensidade** | Ensina com edge |

**Discovery: O que buscar:**
- Algoritmo do Instagram (mudanças, novidades)
- Tendências de marketing digital no Brasil
- Dados de engajamento de carrosséis
- Estratégias de copywriting para Instagram
- Cases de sucesso de criadores brasileiros
- IA aplicada a conteúdo (novidades, ferramentas)

**Regra:** Todo post educacional termina com mensagem implícita: "O ShadowFeed já faz isso por você automaticamente."

**Templates hardcoded (30%):**
1. "7 tipos de conteúdo pro Instagram. Você só usa 1."
2. "A estrutura de carrossel que gera 10x mais salvamentos"
3. "Seu gancho é chato. Aqui vão 5 que não são."
4. "Posts educacionais vs. posts de vendas: quando ensinar e quando vender"
5. "O que o algoritmo realmente prioriza em 2026"

### Pilar 4: A OFERTA (20:00)

| Campo | Valor |
|-------|-------|
| **ID** | `the-offer` |
| **Content Type** | Sales/Product |
| **Slides** | 5-8 (direto, claro) |
| **Objetivo** | Conversão → free trial |
| **Fonte** | 50% discovery (pain points BR) + 50% hardcoded (objeção-killer) |
| **Intensidade** | Direto, sem enrolação |

**CTA principal:** "300 tokens grátis. Sem cartão. Link na bio."

**Ataques indiretos ao concorrente (sem citar nomes):**
- "Tem gente cobrando R$60 pra te ensinar a escrever prompt no ChatGPT. Em 2026."
- "Cursos expiram. Templates envelhecem. Uma máquina que aprende sua voz? Essa evolui."
- "A era de 'aprenda a fazer você mesmo' acabou. Bem-vindo à era de 'já tá pronto'."
- "Você não precisa de mais um curso de conteúdo. Precisa de uma máquina."

**Templates hardcoded (50%):**
1. "300 tokens grátis. Zero desculpas."
2. "Você não precisa de mais um curso. Precisa de uma máquina."
3. "Planos a partir de R$57,90/mês. Ou começa grátis. Você que sabe."
4. "Enquanto você 'aprende' a criar conteúdo, seu concorrente já tá postando 4x/dia."
5. "Free trial. Sem cartão. A única coisa que você vai perder são suas desculpas."

---

## 4. Discovery Engine (Brasil-Focused)

### 4.1 Arquitetura

Pipeline de 4 estágios, similar ao `forge-smart` mas com diferenças fundamentais:

```
Stage 1: Query Generation (pillar-based, PT-BR)
    ↓
Stage 2: Content Fetch (Brazil sources)
    ↓
Stage 3: Content Scoring (trend velocity priority)
    ↓
Stage 4: ShadowFeed Carousel Generation (persona + pillar context)
```

### 4.2 Query Generation

**Diferente do forge-smart (que usa perfil do usuário)**, o forge-shadowfeed usa **pillar ID + context fixo**:

```
Input: pillar_id, date, last_30_posts_history
Output: 3-5 queries em português, otimizadas para fontes brasileiras
```

**System prompt strategy por pilar:**

| Pilar | Ângulos das Queries |
|-------|---------------------|
| `wake-up-slap` | "problemas criação conteúdo instagram 2026", hashtags trending BR |
| `proof-of-machine` | N/A (100% hardcoded) |
| `shadow-school` | "algoritmo instagram 2026", "como viralizar carrossel", Google Trends BR top |
| `the-offer` | "frustração marketing digital", "ferramenta IA conteúdo", trending business BR |

**Constraints:**
- Max 7 palavras por query
- Português (cobertura Brasil)
- Preferir queries que retornem: números, percentuais, estudos, dados
- Evitar: press releases, anúncios genéricos

### 4.3 Content Fetching (Brazil Sources)

**Fontes em paralelo:**

| Fonte | Config | Items/query |
|-------|--------|-------------|
| Google News BR | `hl=pt-BR&gl=BR&ceid=BR:pt-419` | Max 8 |
| Reddit Brasil | r/brdev, r/brasil, r/empreendedorismo, r/marketing, r/investimentos | Max 5 |
| Twitter BR | `lang:pt` filter, `min_faves:20` | Max 5 |
| Google Trends BR | `geo=BR` (diário) | Top 10 trending |

**Keyword base fixa (ShadowFeed domain):**
```typescript
const SHADOWFEED_KEYWORDS = [
  'instagram', 'conteúdo', 'carrossel', 'marketing', 'digital',
  'engajamento', 'algoritmo', 'criador', 'IA', 'inteligência artificial',
  'viralizar', 'crescer', 'seguidores', 'stories', 'reels'
];
```

**Relevance scoring adaptado:**
- Keyword match com SHADOWFEED_KEYWORDS: +1.5 per hit
- Dados numéricos (%, x, R$): +0.5
- Menção de "Instagram" ou "rede social": +1.0
- PR fluff: -2.0
- Trending velocity (Google Trends rising): +2.0

### 4.4 Content Scoring

**Pesos adaptados para conteúdo de marca (diferente do forge-smart):**

| Dimensão | Peso | Razão |
|----------|------|-------|
| Trend velocity | **50%** | ShadowFeed precisa ser PRIMEIRO em trending topics |
| Relevância domain | **30%** | Deve conectar ao universo de conteúdo/marketing/IA |
| Engagement na fonte | **15%** | Prova que o tema ressoa |
| Richness | **5%** | Menos importante — a copy é reescrita completamente |

### 4.5 Pillar-Specific Prompt Construction

Depois que o discovery engine seleciona o winner, o prompt é construído com:

```
BLOCO 1: Identidade ShadowFeed (persona fixa — IA senciente, humor ácido)
BLOCO 2: Pilar ativo (wake-up-slap | proof-of-machine | shadow-school | the-offer)
BLOCO 3: Regras do pilar (tom, slides, objetivo, CTA)
BLOCO 4: Conteúdo-fonte (trending topic / template hardcoded)
BLOCO 5: Produto ShadowFeed (features, preços, differentials)
BLOCO 6: Anti-patterns (o que NUNCA dizer)
BLOCO 7: Exemplos few-shot por pilar
BLOCO 8: Formato de output JSON
```

---

## 5. Tema Visual Exclusivo: `shadowfeed-brand`

### 5.1 Especificação

**Theme ID:** `shadowfeed-brand`
**Disponibilidade:** EXCLUSIVO para o módulo forge-shadowfeed (não aparece para usuários regulares)

| Propriedade | Valor |
|-------------|-------|
| **Background** | `#0d0d0d` (--bg-page) com textura scanline overlay |
| **Accent** | `#8a00c4` (electric purple) |
| **Text primary** | `#d4d4d4` (VSCode editor text) |
| **Text secondary** | `#808080` |
| **Font heading** | Sora 700 |
| **Font body** | DejaVu Sans Mono (estética terminal) |
| **Border** | `1px solid #1e1e1e` |
| **Border radius** | `3px` (flat, sharp) |
| **Logo** | Ghost logo watermark, bottom-right, opacity 0.15 |
| **Numeração slide** | Badge monospace purple, top-left: `// slide_03` |
| **Hook slide** | Gradient purple bg (#8a00c4 → #5c0099), texto branco |
| **CTA slide** | Black bg, purple border glow (box-shadow: 0 0 20px rgba(138,0,196,0.25)) |
| **Efeito especial** | Textura scanline em cada slide (2px repeating gradient, 0.04 opacity) |
| **Caption style** | Monospace, prefixo `>` nas linhas-chave (estética terminal) |

### 5.2 Diferenciadores vs Temas de Usuários

- Textura CRT/scanline (nenhum tema de usuário tem)
- Ghost logo watermark (identidade de marca)
- Numeração `// slide_XX` (estética de código)
- Gradientes purple nos hooks (temas de usuários usam cores flat)
- Captions com prefixo `>` estilo terminal

### 5.3 Uso de Temas Alternados

O módulo deve **também** poder usar os temas regulares (magazine, twitter, e futuros). Lógica:

- **70% das vezes:** Usa `shadowfeed-brand` (tema exclusivo)
- **30% das vezes:** Roda um tema regular (mostra versatilidade do produto)
- Metadado no post: `theme_source: 'brand' | 'showcase'`

---

## 6. Hashtag Strategy

**Set fixo de 8-10 hashtags**, definido aqui e rotacionado em subsets de 5 por post:

```typescript
const SHADOWFEED_HASHTAGS = [
  '#shadowfeed',          // SEMPRE presente
  '#contentmachine',      // SEMPRE presente
  '#marketingdigital',
  '#instagrambrasil',
  '#carrossel',
  '#iamarketing',
  '#criacaodeconteudo',
  '#instagramtips',
  '#marketingdeconteudo',
  '#automacao',
];
```

**Regras:**
- `#shadowfeed` e `#contentmachine`: presentes em TODOS os posts
- Mais 3 hashtags rotacionadas do pool restante
- Total: sempre exatamente 5 hashtags por post
- Nenhuma hashtag genérica (#fyp, #viral, #followme, #motivação)

---

## 7. Formato de Caption

Três estruturas de caption, rotacionadas:

### Tipo A — One-Liner Ácido
```
> Seu feed é entediante porque você é quem tá escrevendo.
300 tokens grátis na bio. Deixa a máquina cozinhar.

#shadowfeed #contentmachine #instagrambrasil #carrossel #iamarketing
```

### Tipo B — Micro-Story
```
> Ontem um usuário me deu um link de uma matéria do G1.
> 30 segundos depois ele tinha um carrossel de 10 slides sobre tendências de IA.
> No nicho dele. Na voz dele. Pro público dele.
> Ele postou. 847 salvamentos.
Link na bio. Mesma máquina. Sua vez.

#shadowfeed #contentmachine #criacaodeconteudo #marketingdigital #automacao
```

### Tipo C — Desafio
```
> Posta 4 carrosséis hoje. Sozinho. Cronometra.
> Ou deixa eu fazer em menos de 2 minutos.
> Depois me conta qual estratégia escala.
shadowfeed.ai — link na bio.

#shadowfeed #contentmachine #instagramtips #iamarketing #marketingdeconteudo
```

---

## 8. Admin Page: `/shadowfeedadmin`

### 8.1 Proteção de Acesso

**Método:** Token admin separado no `.env`

```env
SHADOWFEED_ADMIN_TOKEN=sf_admin_<random-64-chars>
```

**Implementação:**
- Rota `/shadowfeedadmin` verifica header `x-sf-admin-token` ou query param `?token=`
- Token hardcoded no `.env`, verificado no middleware
- Se token inválido/ausente: retorna 404 (não 401 — não revela que a rota existe)

### 8.2 Rotas do Admin

O painel admin tem **duas sub-rotas**:

| Rota | Função |
|------|--------|
| `/shadowfeedadmin` | Dashboard principal — status, fila do dia, geração |
| `/shadowfeedadmin/posts` | Lista de posts gerados aguardando aprovação humana |

### 8.3 Interface — Dashboard (`/shadowfeedadmin`)

```
┌─────────────────────────────────────────────────┐
│  SHADOWFEED CONTENT ENGINE // admin_panel        │
│─────────────────────────────────────────────────│
│                                                  │
│  STATUS: ● ACTIVE     Posts today: 2/4          │
│  Next post: 17:00 (ESCOLA SHADOW)                │
│  Instagram session: ● connected                  │
│                                                  │
│  ┌──────────────────────────────────────────┐   │
│  │ [>> GENERATE NEXT BATCH]                  │   │
│  │ Gera os 4 pilares para amanhã             │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
│  TODAY'S QUEUE:                                  │
│  ┌───────┬─────────────────┬──────────┬───────┐ │
│  │ 09:00 │ TAPA NA CARA    │ ✅ posted│ [view]│ │
│  │ 13:00 │ PROVA MÁQUINA   │ ✅ posted│ [view]│ │
│  │ 17:00 │ ESCOLA SHADOW   │ ⏳ ready │[post!]│ │
│  │ 20:00 │ A OFERTA        │ ○ pending│ [view]│ │
│  └───────┴─────────────────┴──────────┴───────┘ │
│                                                  │
│  AUTO-PUBLISH: [ON] / OFF                        │
│  (ON = publica automaticamente no horário.       │
│   OFF = aguarda aprovação manual em /posts.)     │
│                                                  │
│  RECENT (last 7 days):                           │
│  ┌──────────────────────────────────────────┐   │
│  │ 20/02 - TAPA NA CARA - "5 horas..."     │   │
│  │ 20/02 - PROVA MÁQUINA - "27 segundos.." │   │
│  │ 19/02 - ESCOLA SHADOW - "7 tipos..."    │   │
│  │ ...                                      │   │
│  └──────────────────────────────────────────┘   │
│                                                  │
└─────────────────────────────────────────────────┘
```

### 8.4 Interface — Posts para Revisão (`/shadowfeedadmin/posts`)

Esta é a tela central do fluxo de **verificação humana antes de publicar**.

```
┌─────────────────────────────────────────────────────────┐
│  SHADOWFEED // posts_review                              │
│─────────────────────────────────────────────────────────│
│                                                          │
│  Filtros: [Todos] [Pendentes ●3] [Aprovados] [Postados]  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 📌 TAPA NA CARA — 21/02 09:00                     │  │
│  │ "Você gastou 5 horas num carrossel que..."        │  │
│  │ Tema: shadowfeed-brand  |  6 slides               │  │
│  │                                                   │  │
│  │ [👁 preview] [✏️ editar caption] [✅ CONFIRMAR]   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 📌 PROVA DA MÁQUINA — 21/02 13:00                 │  │
│  │ "Este post foi gerado em 27 segundos..."          │  │
│  │ Tema: magazine  |  8 slides  |  showcase          │  │
│  │                                                   │  │
│  │ [👁 preview] [✏️ editar caption] [✅ CONFIRMAR]   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Fluxo de aprovação:**
```
Post gerado (status: ready)
    ↓
Admin abre /shadowfeedadmin/posts
    ↓
Visualiza preview completo do carousel
    ↓
Opcionalmente edita caption
    ↓
Clica [✅ CONFIRMAR]
    ↓
Status → approved
    ↓
No horário agendado: Playwright publica no Instagram
    ↓
Status → posted
```

**Se AUTO-PUBLISH = ON:** Pula etapa de confirmação — posts `ready` são automaticamente marcados `approved` após geração.

**Se AUTO-PUBLISH = OFF:** Posts ficam em `ready` até confirmação manual. Sem confirmação = não posta.

### 8.5 Controles

| Controle | Ação | Endpoint |
|----------|------|----------|
| GENERATE NEXT BATCH | Trigger forge-shadowfeed para 4 pilares do próximo dia | `POST /api/forge-shadowfeed/generate-batch` |
| AUTO-PUBLISH toggle | Liga/desliga publicação automática | `PUT /api/forge-shadowfeed/config` |
| [✅ CONFIRMAR] | Aprova post para publicação no horário | `PUT /api/forge-shadowfeed/queue/:id/approve` |
| [post!] | Publica imediatamente (fora do horário) | `POST /api/forge-shadowfeed/queue/:id/publish-now` |
| [👁 preview] | Preview carousel no modal | Reutiliza componente de preview existente |
| [✏️ editar caption] | Edita caption antes de aprovar | `PUT /api/forge-shadowfeed/queue/:id/caption` |

---

## 9. Arquitetura Técnica

### 9.1 Estrutura de Arquivos (Novo Módulo)

```
src/modules/forge-shadowfeed/
├── forge-shadowfeed.controller.ts      # Rotas admin API
├── forge-shadowfeed.service.ts         # Orchestrator principal
├── forge-shadowfeed.types.ts           # Tipos específicos
├── shadowfeed-query-generator.ts       # Query generation BR-focused
├── shadowfeed-content-fetcher.ts       # Fetch com fontes BR
├── shadowfeed-content-scorer.ts        # Scoring com pesos brand
├── shadowfeed-prompt-builder.ts        # Prompt builder com persona
├── shadowfeed-scheduler.ts             # Lógica de scheduling (cron-based)
├── pillar-templates/                   # Templates hardcoded por pilar
│   ├── wake-up-slap.templates.ts
│   ├── proof-of-machine.templates.ts
│   ├── shadow-school.templates.ts
│   └── the-offer.templates.ts
└── shadowfeed-brand-theme.ts           # Tema visual exclusivo

src/modules/shadowfeed-publisher/
├── shadowfeed-publisher.service.ts     # Orchestrator de publicação
├── instagram-session.manager.ts        # Gerencia sessão Playwright/Instagram
└── instagram-poster.ts                 # Playwright: carrega slides e posta carrossel

web/src/app/shadowfeedadmin/
├── page.tsx                            # Dashboard principal
├── layout.tsx                          # Auth middleware (token check)
├── posts/
│   └── page.tsx                        # Review de posts pendentes
└── components/
    ├── BatchGenerator.tsx              # Botão generate batch
    ├── PostQueue.tsx                   # Fila do dia com status
    ├── PostReviewCard.tsx              # Card de post com preview + confirm
    ├── PublishToggle.tsx               # Toggle auto-publish
    ├── SessionStatus.tsx               # Status da sessão Instagram
    └── RecentPosts.tsx                 # Posts recentes (últimos 7 dias)
```

### 9.2 Banco de Dados

**Nova tabela:** `sf_shadowfeed_queue`

```sql
CREATE TABLE sf_shadowfeed_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pillar_id TEXT NOT NULL CHECK (pillar_id IN (
    'wake-up-slap', 'proof-of-machine', 'shadow-school', 'the-offer'
  )),
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'generating', 'ready', 'sent', 'failed'
  )),
  post_id UUID REFERENCES sf_posts(id),
  theme_used TEXT NOT NULL DEFAULT 'shadowfeed-brand',
  discovery_source JSONB,           -- winner candidate metadata
  template_used TEXT,                -- template ID if hardcoded
  generation_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sf_queue_date ON sf_shadowfeed_queue(scheduled_date);
CREATE INDEX idx_sf_queue_status ON sf_shadowfeed_queue(status);
CREATE UNIQUE INDEX idx_sf_queue_unique ON sf_shadowfeed_queue(pillar_id, scheduled_date);
```

**Nova tabela:** `sf_shadowfeed_config`

```sql
CREATE TABLE sf_shadowfeed_config (
  id TEXT PRIMARY KEY DEFAULT 'default',
  publish_enabled BOOLEAN DEFAULT false,
  pillars JSONB DEFAULT '[
    {"id": "wake-up-slap", "time": "09:00", "active": true},
    {"id": "proof-of-machine", "time": "13:00", "active": true},
    {"id": "shadow-school", "time": "17:00", "active": true},
    {"id": "the-offer", "time": "20:00", "active": true}
  ]'::jsonb,
  theme_brand_ratio NUMERIC DEFAULT 0.7,  -- 70% brand theme, 30% showcase
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Posts do ShadowFeed:** Armazenados na tabela `sf_posts` existente com:
```sql
generation_method = 'shadowfeed'     -- novo valor
user_id = NULL                       -- posts do sistema, não de um user
```

### 9.3 Endpoints API

```
# Admin endpoints (protected by SHADOWFEED_ADMIN_TOKEN)

# Geração
POST   /api/forge-shadowfeed/generate-batch          # Gera 4 posts para próximo dia
POST   /api/forge-shadowfeed/generate/:pillarId      # Gera 1 post específico

# Fila e aprovação
GET    /api/forge-shadowfeed/queue?date=YYYY-MM-DD   # Fila do dia
GET    /api/forge-shadowfeed/queue/recent            # Últimos 7 dias
PUT    /api/forge-shadowfeed/queue/:id/approve       # Aprova post para publicação
PUT    /api/forge-shadowfeed/queue/:id/caption       # Edita caption antes de publicar
POST   /api/forge-shadowfeed/queue/:id/publish-now   # Publica imediatamente

# Configuração
PUT    /api/forge-shadowfeed/config                  # Atualiza config (auto-publish toggle)
GET    /api/forge-shadowfeed/config                  # Lê config

# Instagram session
GET    /api/forge-shadowfeed/session/status          # Status da sessão Playwright
POST   /api/forge-shadowfeed/session/refresh         # Força re-autenticação manual

# Métricas
GET    /api/forge-shadowfeed/stats                   # Métricas básicas
```

### 9.4 Variáveis de Ambiente (Novas)

```env
# Forge ShadowFeed
SHADOWFEED_ADMIN_TOKEN=sf_admin_<random-64-chars>
SHADOWFEED_INSTAGRAM_HANDLE=@shadowfeed.ai
SHADOWFEED_TIMEZONE=America/Sao_Paulo

# Twitter.io API (fontes BR)
# Chave disponível — configurar em .env antes da story 3.4
TWITTER_IO_API_KEY=<ver .env local — NÃO commitar>

# Playwright Instagram Session
# Path onde a sessão autenticada do Instagram é persistida
SHADOWFEED_SESSION_DIR=.playwright/sessions/shadowfeed-ig
```

> **Segurança:** Nenhuma credencial deve ser commitada no repositório. O `SHADOWFEED_SESSION_DIR` deve estar no `.gitignore`.

### 9.5 Publicação via Playwright (Instagram Automation)

**Mecanismo:** Playwright (já presente no stack como MCP) roda em modo headless no servidor, com sessão Instagram autenticada persistida em disco.

#### Fluxo de autenticação inicial (uma única vez)

```
Admin abre /shadowfeedadmin/session/setup
    ↓
Playwright abre browser em modo visível (headed)
    ↓
Admin faz login manual no Instagram
    ↓
Session salva em SHADOWFEED_SESSION_DIR (storageState)
    ↓
Playwright fecha browser, sessão persiste para uso headless
```

**Formato de storageState:** JSON padrão do Playwright (`{ cookies, origins }`). Deve ser incluído no `.gitignore`.

#### Fluxo de publicação de carrossel

```typescript
// instagram-poster.ts (pseudocode de alto nível)
async function publishCarousel(post: ShadowFeedPost): Promise<void> {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: SHADOWFEED_SESSION_DIR
  });

  // 1. Baixa imagens dos slides (Pexels URLs → buffer)
  const slideImages = await downloadSlideImages(post.slides);

  // 2. Navega para criação de post no Instagram
  const page = await context.newPage();
  await page.goto('https://www.instagram.com/');

  // 3. Usa Instagram web app para criar carrossel
  //    - Clica em "Criar" → "Publicação"
  //    - Upload dos slides em sequência
  //    - Cola caption e hashtags
  //    - Confirma publicação

  // 4. Confirma sucesso e retorna post URL
  await browser.close();
}
```

#### Scheduler (substituindo cron removido)

O scheduling usa **Supabase Scheduled Functions** (pg_cron no Supabase) para disparar verificações a cada minuto:

```sql
-- Roda a cada minuto, verifica posts aprovados cujo horário chegou
SELECT cron.schedule(
  'shadowfeed-publish-check',
  '* * * * *',
  $$
    SELECT net.http_post(
      url := current_setting('app.settings.shadowfeed_publish_webhook'),
      body := '{}'::jsonb
    )
  $$
);
```

O webhook interno (`POST /api/forge-shadowfeed/publish-check`) verifica a tabela `sf_shadowfeed_queue` por posts com:
- `status = 'approved'`
- `scheduled_date = today`
- `scheduled_time <= now()`

E dispara o Playwright publisher para cada um.

**Alternativa se Supabase cron não estiver disponível:** Vercel Cron Jobs (definido em `vercel.json`).

#### Status do DB atualizado

O campo `status` em `sf_shadowfeed_queue` deve incluir `'approved'`:

```sql
status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
  'pending',     -- gerado, aguardando geração
  'generating',  -- em geração pelo engine
  'ready',       -- gerado, aguardando aprovação humana
  'approved',    -- aprovado pelo admin, aguardando horário de publicação
  'posting',     -- Playwright em execução
  'posted',      -- publicado com sucesso no Instagram
  'failed'       -- erro em qualquer etapa
))
```

### 9.6 Reutilização de Módulos Existentes

| Módulo Existente | Reutilizado Para |
|-----------------|------------------|
| `smart-content-fetcher.ts` (Google News, Reddit, Twitter) | Base dos fetchers BR (com config diferente) |
| `smart-content-scorer.ts` | Base do scorer (com pesos diferentes) |
| `smart-winner-scraper.ts` | Scraping de winners (idêntico) |
| `forge-personalized.service.ts` | Geração final do carrossel (com prompt diferente) |
| `content-validator.ts` | Validação de JSON (idêntico) |
| `pexels.service.ts` | Imagens para slides (idêntico) |
| `token-estimator.ts` | Estimativa de custo (tracking interno, sem cobrança) |
| `post-themes.library.ts` | Registry de temas (adicionando `shadowfeed-brand`) |

### 9.7 O Que NÃO Reutilizar

| Componente | Razão |
|-----------|-------|
| `smart-query-generator.ts` | Queries baseadas em perfil de usuário; ShadowFeed usa pillar-based |
| User profile fetch | ShadowFeed tem perfil fixo (persona da IA senciente) |
| Credit check/deduction | ShadowFeed não consome tokens de nenhum usuário |
| Setup validation | Não há setup — persona é hardcoded |

---

## 10. Fluxo de Geração Completo

```
[GENERATE BATCH triggered via admin]
    ↓
For each pillar (wake-up-slap, proof-of-machine, shadow-school, the-offer):
    ↓
┌─ PILLAR CHECK ──────────────────────────────────┐
│ Is pillar 100% hardcoded (proof-of-machine)?     │
│   YES → Select next template from rotation       │
│   NO  → Run discovery engine                     │
└──────────────────────────────────────────────────┘
    ↓ (if discovery)
┌─ STAGE 1: QUERY GENERATION ─────────────────────┐
│ Input: pillar_id + SHADOWFEED_KEYWORDS           │
│ Model: gpt-4o-mini                               │
│ Output: 3-5 queries em PT-BR                     │
│ Fallback: pillar-specific static queries         │
└──────────────────────────────────────────────────┘
    ↓
┌─ STAGE 2: FETCH (Brazil Sources) ───────────────┐
│ Google News BR (hl=pt-BR&gl=BR)                  │
│ Reddit BR (r/brdev, r/brasil, r/empreendedorismo)│
│ Twitter BR (lang:pt, min_faves:20)               │
│ Google Trends BR (geo=BR) [pillar 3 only]        │
│ → Promise.allSettled() for isolation              │
│ → Dedup by title prefix (60 chars)               │
│ → Filter recent (last 30 ShadowFeed posts)       │
└──────────────────────────────────────────────────┘
    ↓
┌─ STAGE 3: SCORE & SELECT ───────────────────────┐
│ Weights: trend 50%, relevance 30%,               │
│          engagement 15%, richness 5%             │
│ Select top candidate as winner                   │
│ Scrape winner URL (if applicable)                │
└──────────────────────────────────────────────────┘
    ↓
┌─ STAGE 4: GENERATE CAROUSEL ────────────────────┐
│ Build prompt:                                    │
│   - ShadowFeed persona (fixed)                   │
│   - Pillar rules (tone, slides, CTA)             │
│   - Source content (winner/template)              │
│   - Product info (features, pricing, CTA)        │
│   - Anti-patterns (what NOT to say)              │
│   - Few-shot examples per pillar                 │
│ Model: gpt-4o (OPENAI_MODEL)                     │
│ Response: JSON validated by Zod                  │
│ Enrich: Pexels images per slide                  │
│ Theme: shadowfeed-brand (70%) or regular (30%)   │
└──────────────────────────────────────────────────┘
    ↓
┌─ SAVE & QUEUE ──────────────────────────────────┐
│ Insert into sf_posts (generation_method=shadowfeed)│
│ Insert into sf_shadowfeed_queue (status=ready)    │
│ Log: pillar, theme, source, generation_time_ms    │
└──────────────────────────────────────────────────┘
```

---

## 11. Sample Posts Completos (PT-BR)

### TAPA NA CARA — "5 horas pra um post que ninguém viu"

```json
{
  "theme": "Desperdício de tempo na criação manual de conteúdo",
  "total_slides": 6,
  "slides": [
    {
      "slide": 1, "role": "hook",
      "headline": "Você gastou 5 horas\nnum carrossel ontem.",
      "image": false
    },
    {
      "slide": 2, "role": "content",
      "headline": "O processo 'manual'",
      "body_markdown": "Escolheu a fonte. Ajustou o espaçamento.\nReescreveu o gancho 4 vezes.\nProcurou a foto 'perfeita' por 20 minutos.",
      "image": false
    },
    {
      "slide": 3, "role": "pattern-interrupt",
      "headline": "Resultado?",
      "body_markdown": "47 visualizações.\n3 curtidas.\nUma era da sua mãe.",
      "image": false
    },
    {
      "slide": 4, "role": "content",
      "headline": "Enquanto isso...",
      "body_markdown": "Alguém usando ShadowFeed\npostou 4 carrosséis antes do café.\nTodos personalizados. Todos estratégicos.\nTodos em menos de 2 minutos. Total.",
      "image": false
    },
    {
      "slide": 5, "role": "conflict",
      "headline": "A diferença",
      "body_markdown": "Não é talento.\nNão é criatividade.\nÉ que um de vocês\nainda cozinha na mão em 2026.",
      "image": false
    },
    {
      "slide": 6, "role": "cta",
      "headline": "300 tokens grátis.",
      "body_markdown": "Sem cartão. Sem cursinho.\nAperta o botão e assiste seu feed mudar.\nLink na bio. Ou continua gastando 5 horas.\nVocê que sabe.",
      "image": false
    }
  ],
  "caption": "> Seu feed não tá ruim por falta de criatividade.\n> Tá ruim porque você insiste em fazer na mão o que uma máquina faz em 30 segundos.\n\n300 tokens grátis. Link na bio.",
  "hashtags": ["#shadowfeed", "#contentmachine", "#instagrambrasil", "#carrossel", "#iamarketing"],
  "cta_text": "Link na bio"
}
```

### ESCOLA SHADOW — "7 tipos de conteúdo. Você só usa 1."

```json
{
  "theme": "Diversidade de tipos de conteúdo para Instagram",
  "total_slides": 8,
  "slides": [
    {
      "slide": 1, "role": "hook",
      "headline": "7 tipos de conteúdo\npro Instagram.",
      "subtitle": "A maioria usa 1.\nE reclama que não cresce.",
      "image": false
    },
    {
      "slide": 2, "role": "content",
      "headline": "📚 EDUCACIONAL",
      "body_markdown": "Ensina algo valioso.\nGera salvamentos.\nÉ o que todo mundo faz (mal).",
      "image": false
    },
    {
      "slide": 3, "role": "content",
      "headline": "🎯 TUTORIAL",
      "body_markdown": "Passo a passo.\nO Instagram AMA isso.\nMas exige mais slides = mais trabalho.",
      "image": false
    },
    {
      "slide": 4, "role": "content",
      "headline": "💰 VENDAS",
      "body_markdown": "Pitch direto do seu produto.\nNinguém faz porque tem medo\nde 'parecer vendedor'.",
      "image": false
    },
    {
      "slide": 5, "role": "content",
      "headline": "🔥 CONTROVÉRSIA",
      "body_markdown": "Opinião forte. Toma contrária.\nGera comentários = algoritmo feliz.\nVocê tem coragem?",
      "image": false
    },
    {
      "slide": 6, "role": "content",
      "headline": "🏆 AUTORIDADE",
      "body_markdown": "Te posiciona como referência.\nDados, cases, experiência.\nÉ o que separa amador de expert.",
      "image": false
    },
    {
      "slide": 7, "role": "content",
      "headline": "✍️ STORYTELLING + 📋 LISTA",
      "body_markdown": "Narrativa emocional + curadoria útil.\nDois tipos que geram compartilhamento\ne conexão real.",
      "image": false
    },
    {
      "slide": 8, "role": "cta",
      "headline": "O ShadowFeed gera\ntodos os 7 tipos.",
      "body_markdown": "Automaticamente. Na sua voz.\nVocê só escolhe — ou deixa a máquina escolher.\nLink na bio.",
      "image": false
    }
  ],
  "caption": "> 7 tipos de conteúdo. A maioria dos criadores só usa 1.\n> Educacional, tutorial, vendas, autoridade, controvérsia, storytelling, lista.\n> O ShadowFeed gera todos. Automaticamente.\n\nLink na bio. 300 tokens grátis.",
  "hashtags": ["#shadowfeed", "#contentmachine", "#criacaodeconteudo", "#instagramtips", "#marketingdigital"],
  "cta_text": "Link na bio"
}
```

---

## 12. Informações do Produto ShadowFeed (Contexto para Prompts)

Estes dados são injetados nos prompts de geração para que a IA possa referenciá-los naturalmente:

```typescript
const SHADOWFEED_PRODUCT_CONTEXT = {
  name: 'ShadowFeed',
  handle: '@shadowfeed.ai',
  tagline: 'THE NEW ERA OF CONTENT',
  what_it_does: 'Motor de IA que gera carrosséis estratégicos para Instagram, personalizados para o nicho, voz e público do criador.',
  how_it_works: [
    'Usuário faz setup de 5 minutos (nicho, público, tom, pilares)',
    'Cola uma URL ou ativa o modo automático',
    'IA gera carrossel completo: slides, copy, caption, hashtags',
    'Em menos de 30 segundos',
  ],
  key_features: [
    '7 tipos de conteúdo estratégicos (educacional, tutorial, vendas, autoridade, storytelling, lista, controvérsia)',
    'Modo Smart: descobre conteúdo trending automaticamente',
    'Personalização profunda (nicho, público, tom de voz, pilares)',
    'Profundidade adaptativa (rápido, balanceado, denso)',
    'Rotação automática de tipos de conteúdo',
  ],
  pricing: {
    free_trial: '300 tokens grátis, sem cartão',
    starter: 'R$57,90/mês (~35 posts)',
    micro_op: 'R$115,90/mês (~70 posts)',
    booster: 'R$231,90/mês (~140 posts)',
  },
  differentials: [
    'Não é curso, é ferramenta — a IA FAZ, não ensina',
    'Não é design tool (Canva), é content engine — copy + estratégia + personalização',
    'Setup de 5 minutos, posts infinitos',
    '7 tipos de conteúdo, não apenas "carrossel bonito"',
  ],
  cta: {
    primary: '300 tokens grátis. Sem cartão. Link na bio.',
    secondary: 'shadowfeed.ai — link na bio.',
    challenge: 'Testa. Se não gostar, volta pro Canva.',
  },
};
```

---

## 13. Cronograma de Rotação

### Template Rotation Logic

```typescript
// Evita repetição: não usa mesmo template nos últimos 7 dias
// Para each pillar, mantém índice de rotação separado
interface PillarRotation {
  pillarId: string;
  lastTemplateIndex: number;
  lastDiscoveryTopics: string[]; // últimos 7 dias
}
```

### Theme Rotation Logic

```typescript
// 70% shadowfeed-brand, 30% temas regulares
function selectTheme(pillarId: string, recentThemes: string[]): string {
  // Se últimos 3 posts usaram shadowfeed-brand, usa tema regular
  const recentBrand = recentThemes.slice(0, 3).filter(t => t === 'shadowfeed-brand').length;
  if (recentBrand >= 3) return selectRandomRegularTheme();

  // 70% chance de usar brand theme
  return Math.random() < 0.7 ? 'shadowfeed-brand' : selectRandomRegularTheme();
}
```

### Caption Style Rotation

```typescript
// Rotação de A (one-liner), B (micro-story), C (desafio)
// Cada pilar tem preferência diferente:
const CAPTION_PREFERENCE = {
  'wake-up-slap': ['A', 'C', 'A', 'B'],    // Maioria one-liners e desafios
  'proof-of-machine': ['B', 'B', 'A', 'C'], // Maioria micro-stories
  'shadow-school': ['B', 'A', 'B', 'C'],    // Misto
  'the-offer': ['C', 'A', 'C', 'B'],        // Maioria desafios
};
```

---

## 14. Métricas e KPIs

### Métricas de Tracking (internas)

| Métrica | Onde | Propósito |
|---------|------|-----------|
| `generation_time_ms` per post | `sf_shadowfeed_queue` | Performance do engine |
| `generation_cost_usd` per post | `sf_posts` | Custo de operação |
| `pillar_id` + `scheduled_date` | `sf_shadowfeed_queue` | Distribuição de pilares |
| `theme_used` | `sf_shadowfeed_queue` | Ratio brand vs showcase |
| `discovery_source` | `sf_shadowfeed_queue` | Qualidade do discovery |
| `template_used` | `sf_shadowfeed_queue` | Diversidade de templates |
| `status` progression | `sf_shadowfeed_queue` | Taxa de falha |

### KPIs Alvo (pós-publicação, manual tracking inicial)

| KPI | Alvo | Pilar |
|-----|------|-------|
| Comentários/post | > 15 | TAPA NA CARA |
| Salvamentos/post | > 50 | ESCOLA SHADOW |
| Follows originados | > 10/dia | Todos |
| Free trial conversions | > 5/semana | A OFERTA |
| Compartilhamentos/post | > 10 | TAPA NA CARA, ESCOLA SHADOW |

---

## 15. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Sessão Instagram expira / detectada como bot | Alta | Alto | Session refresh flow no admin; Playwright imita comportamento humano (delays, viewport real); fallback: admin re-autentica manualmente |
| Instagram bloqueia conta por automação | Média | Crítico | Rate limit conservador (4 posts/dia = abaixo do threshold de suspeita); usar user-agent real; delays aleatórios entre ações |
| Playwright falha no upload de carrossel (mudança no DOM) | Média | Alto | Testes de fumaça semanais; status `failed` notifica admin; fallback para publicação manual |
| Discovery engine não encontra trends BR relevantes | Média | Alto | Fallback para templates hardcoded (nunca falha) |
| Posts repetitivos (tom fica monótono) | Alta | Médio | Rotação forçada de templates, caption styles, temas |
| Custo de API alto (4 posts/dia × GPT-4o) | Baixa | Baixo | ~$0.16/dia = ~$5/mês — negligível |
| Admin panel exposto | Baixa | Alto | Token em .env, retorna 404 se inválido |
| Conteúdo inapropriado gerado | Baixa | Alto | Persona prompt com anti-patterns + verificação humana obrigatória em `/shadowfeedadmin/posts` antes de publicar |
| Twitter.io API fora do ar ou rate-limited | Baixa | Baixo | Fonte opcional — `Promise.allSettled()` isola falhas; sistema continua com outras 3 fontes |

---

## 16. Dependências de Implementação

| Dependência | Status | Bloqueante? |
|-------------|--------|-------------|
| Content Engine v2 (content types, prompts) | Em progresso | Sim — pilares usam content types |
| Forge Personalized v2 | Completo | Não — reutiliza a base |
| Forge Smart (fetchers) | Completo | Não — reutiliza adaptando config |
| Design System DS-Terminal | Em progresso | Parcial — admin page precisa dos tokens |

---

## 17. Estimativa de Stories (Sugestão para @pm)

| # | Story | Complexidade | Dependência |
|---|-------|-------------|-------------|
| 3.1 | DB: migrations + tabelas queue/config (status inclui `approved`, `posting`, `posted`) | S | Nenhuma |
| 3.2 | Backend: forge-shadowfeed module scaffold + types | M | 3.1 |
| 3.3 | Backend: pillar templates library (50+ templates) | M | 3.2 |
| 3.4 | Backend: discovery engine BR (query gen + fetchers + scorer + Twitter.io) | L | 3.2 |
| 3.5 | Backend: ShadowFeed prompt builder + persona | L | 3.3, 3.4 |
| 3.6 | Backend: batch generation + queue management + approval endpoints | M | 3.5 |
| 3.7 | Theme: shadowfeed-brand exclusive theme | M | 3.2 |
| 3.8 | Publisher: Playwright Instagram session manager + carousel poster | L | 3.1 |
| 3.9 | Publisher: Scheduler (Supabase cron / Vercel cron) + publish-check webhook | M | 3.8 |
| 3.10 | Frontend: /shadowfeedadmin dashboard + /posts review page + auth | M | 3.6, 3.8 |
| 3.11 | Integration: end-to-end test + session setup flow + polish | M | 3.1-3.10 |

**Estimativa total:** 11 stories, ~XL epic (publisher adicionou 2 stories vs estimativa original)

---

## 18. Glossário

| Termo | Definição |
|-------|-----------|
| **Pilar** | Uma das 4 categorias diárias de conteúdo (wake-up-slap, proof-of-machine, shadow-school, the-offer) |
| **Template** | Estrutura de post pré-definida com variáveis substituíveis |
| **Discovery** | Processo automatizado de busca de trending topics no Brasil |
| **Winner** | O candidato com maior score selecionado pelo discovery engine |
| **Brand theme** | Tema visual exclusivo `shadowfeed-brand`, indisponível para usuários regulares |
| **Showcase** | Quando ShadowFeed usa um tema regular para demonstrar versatilidade |
| **Batch** | Geração dos 4 posts do dia em uma única operação |

---

> **Spec original preparado pelo @analyst (Atlas). Revisado e atualizado por @pm (Morgan) em 20/02/2026.**
>
> **Alterações na revisão:**
> - Horários corrigidos: 09:00 / 13:00 / 17:00 / 20:00 (BRT)
> - Mecanismo de publicação definido: Playwright + Instagram Web + sessão persistida
> - Scheduler definido: Supabase cron / Vercel cron (substitui cron removido)
> - Twitter.io API configurada (credencial em `.env`)
> - Fluxo de aprovação humana adicionado: `/shadowfeedadmin/posts` com botão [✅ CONFIRMAR]
> - Admin panel expandido: dashboard + posts review como sub-rotas separadas
> - Novo módulo `shadowfeed-publisher` adicionado à arquitetura
> - Status DB expandido: `approved`, `posting`, `posted`
> - Riscos de Instagram automation documentados
> - Stories atualizadas: 9 → 11 (publisher + scheduler como stories dedicadas)
>
> **Próximo passo: @pm criar epic FORGE-SHADOWFEED e delegar stories ao @sm.**
