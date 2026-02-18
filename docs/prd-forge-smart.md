# FORGE-SMART — PRD v1.0

> **Feature Codename:** FORGE-SMART
> **Tipo:** Nova Feature — Modo de Geração Automática de Posts
> **Referencia:** `pdrshadowfeed.md` (PRD principal v1.0)
> **Documento otimizado para execução via Claude Code.**

---

## 1. Problema

O fluxo atual de criação de posts (`/criar-post`) exige que o usuário forneça uma URL de notícia manualmente. Isso cria três fricções:

1. **Descoberta de conteúdo é do usuário** — ele precisa encontrar, avaliar e copiar a URL.
2. **Consistência quebrada** — usuários que não estão monitorando seu nicho ativamente ficam sem postar.
3. **Escalabilidade bloqueada** — o produto não consegue entregar valor de forma autônoma.

---

## 2. Objetivo

Implementar um modo de geração automática (`FORGE-SMART`) que descobre, avalia e seleciona o conteúdo mais relevante para o usuário **sem nenhuma interação manual**, usando os campos de perfil (`target_audience`, `main_pain_point`, `voice_tone`, `user_prompt`) como inteligência de entrada.

O usuário apenas escolhe: tema visual + modelo LLM + (opcionalmente) modo produto. O sistema faz o resto.

---

## 3. Escopo

### In Scope (v1.0)
- Geração de queries de busca personalizadas via LLM (Stage 1)
- Busca multi-fonte paralela: Google News RSS + Reddit (Stage 2)
- Scoring e seleção do melhor conteúdo (Stage 3)
- Integração com `forge-personalized` existente (Stage 4)
- Toggle "Manual / Automático" no frontend `/criar-post`
- Coluna `generation_method` em `sf_posts` para observabilidade
- Deduplicação por usuário para evitar reaproveitamento de conteúdo

### Out of Scope (v1.0)
- Integração com Twitter/X (requer Playwright, adicionar em v1.1)
- Integração com Google Trends (adicionar em v1.1)
- Feedback loop (usuário aprovar/rejeitar sugestão antes de gerar)
- Agendamento automático ("gerar todo dia às 9h")
- Histórico de queries geradas por usuário

---

## 4. Arquitetura

### 4.1 Pipeline FORGE-SMART (4 estágios)

```
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1 — Smart Query Generator                                 │
│                                                                  │
│  Input:  UserProfile { target_audience, main_pain_point,        │
│          voice_tone, user_prompt }                               │
│                                                                  │
│  Processo: LLM call rápido (gpt-4o-mini) gera 5 queries         │
│  diversas com ângulos distintos:                                 │
│   - ângulo trending (o que está em alta no nicho)               │
│   - ângulo dor (conteúdo que toca na main_pain_point)           │
│   - ângulo solução (como resolver o problema)                    │
│   - ângulo história/case (exemplo real)                         │
│   - ângulo dados/pesquisa (estatística/estudo)                  │
│                                                                  │
│  Output: string[] — 5 queries em PT-BR e EN-US                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  STAGE 2 — Smart Content Fetcher                                 │
│                                                                  │
│  Fetch paralelo das 5 queries em 2 fontes:                      │
│   - Google News RSS (parameterizado por query)                   │
│   - Reddit search (via snoowrap, busca global, não subreddit)   │
│                                                                  │
│  Produz pool de ~20-30 candidatos brutos                        │
│  Filtra: remove já usados por este userId em sf_posts           │
│                                                                  │
│  Output: SmartCandidate[]                                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  STAGE 3 — Smart Content Scorer                                  │
│                                                                  │
│  Score = (recency × 0.4) + (engagement × 0.3) +                │
│          (relevance × 0.2) + (content_richness × 0.1)           │
│                                                                  │
│  recency:          horas desde publicação (mais novo = maior)   │
│  engagement:       source_score normalizado (upvotes/likes)     │
│  relevance:        relevance_score do RECON (0-10)              │
│  content_richness: tem summary não-vazio + url válida           │
│                                                                  │
│  Output: SmartCandidate (melhor candidato único)                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  STAGE 4 — forge-personalized (já existe)                        │
│                                                                  │
│  Recebe o candidato selecionado como sourceContent               │
│  Chama forgePersonalizedCarousel() internamente                  │
│  Pipeline completo: LLM → Pexels → Theme → DB → Tokens          │
│                                                                  │
│  Post salvo com generation_method = 'smart'                     │
│  smart_query_used = query que gerou o candidato selecionado      │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Estrutura de Arquivos

```
src/
└── modules/
    └── forge-smart/                         # NOVO MÓDULO
        ├── forge-smart.types.ts             # Tipos/interfaces
        ├── smart-query-generator.ts         # Stage 1
        ├── smart-content-fetcher.ts         # Stage 2
        ├── smart-content-scorer.ts          # Stage 3
        ├── forge-smart.service.ts           # Orquestra stages 1-4
        └── forge-smart.controller.ts        # HTTP controller

web/src/app/criar-post/
└── page.tsx                                 # MODIFICAR — toggle manual/auto
```

---

## 5. Modelo de Dados

### 5.1 Alterações em `sf_posts` (Supabase migration)

```sql
-- Adicionar à tabela sf_posts
ALTER TABLE sf_posts
  ADD COLUMN IF NOT EXISTS generation_method TEXT DEFAULT 'manual'
    CHECK (generation_method IN ('manual', 'smart')),
  ADD COLUMN IF NOT EXISTS smart_query_used TEXT;
```

**`generation_method`**: rastreia se o post foi gerado via URL manual ou FORGE-SMART. Alimenta analytics futuros.

**`smart_query_used`**: a query que originou o conteúdo selecionado. Permite debugging e melhoria iterativa das queries geradas.

### 5.2 Deduplicação — sem nova tabela

A deduplicação é feita consultando `sf_posts` para o `userId` e excluindo candidatos cujos títulos já aparecem como `smart_query_used`. Isso evita criar infraestrutura nova para v1.0.

Alternativa mais robusta (v1.1): tabela `sf_smart_used_sources` com `(user_id, source_url, source_title_hash)`.

---

## 6. API

### Novo endpoint

```
POST /api/forge-smart/generate
```

**Request body:**
```typescript
{
  userId: string;       // UUID do usuário autenticado
  themeId: string;      // 'magazine' | 'twitter' | 'minimalist' | 'educational'
  modelConfigId?: string; // 'marketing-friend' | 'copywriter' | 'shadowfeed'
  productMode?: boolean;
  productDescription?: string;
  ctaText?: string;
}
```

**Response (fire-and-forget):**
```typescript
{ success: true, message: 'Generation started' }
// HTTP 202 Accepted
```

O processamento é assíncrono (mesmo padrão do `/api/forge-personalized/generate`). O frontend navega para `/my-posts?generating=true` imediatamente após o 202.

### Registro de rota

Em `src/routes/index.ts`:
```typescript
import forgeSmartRouter from '../modules/forge-smart/forge-smart.controller.js';
router.use('/forge-smart', forgeSmartRouter);
```

---

## 7. Stage 1 — Smart Query Generator

### Contrato

```typescript
interface SmartQueryGeneratorInput {
  target_audience: string;
  main_pain_point: string;
  voice_tone: string;
  user_prompt?: string;
}

type SmartQueryGeneratorOutput = string[]; // 5 queries
```

### Estratégia de geração

Usa `gpt-4o-mini` (barato, rápido, ~$0.0001/call) com `response_format: { type: 'json_object' }`.

**System prompt:**
```
Você é um especialista em SEO e curadoria de conteúdo.
Dado o perfil de um criador de conteúdo, gere 5 queries de busca
em inglês (para maior cobertura) que encontrarão notícias e posts
relevantes para o público-alvo dele.

Retorne JSON: { "queries": ["query1", ..., "query5"] }

Regras:
- Cada query deve ter ângulo distinto (trending, pain, solution, story, data)
- Queries em inglês para maior cobertura de resultados
- Sem caracteres especiais, sem aspas
- Máximo 6 palavras por query
- Relevantes para o nicho e dor específica do usuário
```

**User prompt:**
```
Público-alvo: {target_audience}
Dor principal: {main_pain_point}
Tom de voz: {voice_tone}
Negócio: {user_prompt || 'N/A'}

Gere 5 queries de busca diversas para encontrar conteúdo relevante.
```

---

## 8. Stage 2 — Smart Content Fetcher

### Fontes (v1.0)

| Fonte | Método | Função existente | Adaptação necessária |
|---|---|---|---|
| Google News RSS | GET (RSS) | `scrapeGoogleNews()` | Criar `fetchNewsByQuery(query)` parametrizado |
| Reddit | snoowrap | `scrapeReddit()` | Criar `searchRedditByQuery(query)` usando `reddit.search()` |

### Fetch paralelo

```
5 queries × 2 fontes = 10 chamadas em paralelo (Promise.allSettled)
Esperado: ~15-25 resultados únicos após deduplicação por título
```

### Deduplicação interna

Deduplicar por `title.toLowerCase().slice(0, 60)` (mesma lógica de `news.source.ts`).

### Deduplicação por usuário

Consultar `sf_posts` onde `user_id = userId` e `generation_method = 'smart'` e `smart_query_used IS NOT NULL`, retornando os últimos 20 `smart_query_used`. Excluir candidatos cujos títulos coincidam com esses.

### Tipo SmartCandidate

```typescript
interface SmartCandidate {
  source_type: 'google_news' | 'reddit';
  title: string;
  summary: string | null;
  url: string | null;
  author: string | null;
  source_score: number | null;     // upvotes/likes
  source_comments: number | null;
  posted_at: string | null;        // ISO string
  relevance_score: number;         // 0-10 (do RECON)
  query_used: string;              // qual das 5 queries gerou este item
}
```

---

## 9. Stage 3 — Smart Content Scorer

### Fórmula de score

```
finalScore = (recencyScore × 0.40)
           + (engagementScore × 0.30)
           + (relevanceScore × 0.20)
           + (richnessScore × 0.10)
```

**`recencyScore`** (0-10):
- Publicado < 6h: 10
- Publicado < 24h: 8
- Publicado < 48h: 6
- Publicado < 7 dias: 4
- Sem data / mais antigo: 2

**`engagementScore`** (0-10):
- `source_score` normalizado (Reddit upvotes):
  - > 5000: 10 | > 1000: 8 | > 500: 6 | > 100: 4 | null/0: 2

**`relevanceScore`** (0-10):
- Direto do campo `relevance_score` do candidato

**`richnessScore`** (0-10):
- `summary` não-nulo e > 100 chars: +5
- `url` válida: +3
- `author` não-nulo: +2

### Fallback

Se menos de 3 candidatos passarem o stage 2, selecionar o de maior `relevance_score` sem aplicar a fórmula completa.

Se zero candidatos, lançar erro: `[FORGE-SMART] No suitable content found. Try again later.`

---

## 10. Stage 4 — Integração com forge-personalized

O `forge-smart.service.ts` chama `forgePersonalizedCarousel()` com:

```typescript
const request: ForgePersonalizedRequest = {
  // SEM url — conteúdo já foi coletado
  title: winner.title,
  summary: winner.summary ?? undefined,
  rawContent: winner.summary ?? winner.title,
  category: undefined,
  themeId,
  userId,
  productMode,
  productDescription,
  ctaText,
};
```

Após o insert em `sf_posts`, atualizar as colunas extras:
```typescript
await supabase
  .from('sf_posts')
  .update({
    generation_method: 'smart',
    smart_query_used: winner.query_used,
  })
  .eq('id', post.id);
```

---

## 11. Frontend — Toggle Manual / Automático

### Estado novo

```typescript
type PostCreationMode = 'manual' | 'auto';
const [creationMode, setCreationMode] = useState<PostCreationMode>('manual');
```

### Estrutura de steps por modo

| Step | Manual | Auto |
|---|---|---|
| 1 | URL input | ~~Skipped~~ |
| 2 | Tema | Tema |
| 3 | Modelo | Modelo |
| 4 | Produto/CTA | Produto/CTA |

### UI do toggle

Exibir acima do conteúdo do Step 1 atual (e permanecer visível nos steps seguintes em modo auto):

```
[ 🔗 Usar URL ]  [ ✨ Modo Automático ]
```

- Toggle estilo pill/tab (não dropdown)
- Em modo "Automático", o Step 1 é substituído por um card informativo:
  ```
  ✨ Modo Automático
  O ShadowFeed vai buscar automaticamente o melhor conteúdo
  para o seu público: {target_audience}
  [Continuar →]
  ```
- A numeração dos steps em modo auto: 1/3, 2/3, 3/3 (ao invés de 1/4, 2/4, 3/4, 4/4)

### Endpoint chamado

```typescript
// handleGenerate — modo auto
const endpoint = creationMode === 'auto'
  ? '/api/forge-smart/generate'
  : '/api/forge-personalized/generate';

const body = creationMode === 'auto'
  ? { userId: user.id, themeId: selectedTheme, productMode, productDescription, ctaText, modelConfigId: selectedModel }
  : { url: url.trim(), themeId: selectedTheme, userId: user.id, productMode, productDescription, ctaText, modelConfigId: selectedModel };
```

---

## 12. Observabilidade

### Logs estruturados (Pino)

Cada stage deve logar:

```typescript
// Stage 1
logger.info({ userId, queries }, '[FORGE-SMART:QUERY] Generated queries');

// Stage 2
logger.info({ userId, total: candidates.length }, '[FORGE-SMART:FETCH] Candidates collected');

// Stage 3
logger.info({ userId, winner: winner.title, score: winner.finalScore, query: winner.query_used }, '[FORGE-SMART:SCORE] Winner selected');

// Stage 4
logger.info({ userId, postId: post.id, generationMethod: 'smart' }, '[FORGE-SMART:FORGE] Post created');
```

### Analytics futuros (fora do escopo v1.0)

- Dashboard de performance por `generation_method` (manual vs smart)
- Taxa de aprovação de posts smart vs manual
- Queries mais produtivas por `target_audience`

---

## 13. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|---|---|---|
| Zero candidatos encontrados (nicho muito específico) | Média | Fallback: gerar post sobre a `main_pain_point` pura, sem fonte externa |
| Reddit API throttling | Baixa | `Promise.allSettled` ignora falhas individuais; Google News é suficiente sozinho |
| Query LLM retorna queries fora de tema | Baixa | Zod valida formato; score de relevância descarta off-topic |
| Conteúdo já utilizado recentemente | Média | Deduplicação por últimos 20 `smart_query_used` do usuário |
| Tempo total > 45s (Stage 1+2+3+4) | Baixa | Fire-and-forget com 202; Stage 2 é paralelo (~3-5s) |

---

## 14. Critérios de Aceite da Feature

1. `POST /api/forge-smart/generate` retorna 202 em < 500ms
2. Um post é criado em `sf_posts` com `generation_method = 'smart'` e `smart_query_used` preenchido
3. O post gerado segue o mesmo formato e qualidade do modo manual
4. O toggle "Manual / Automático" funciona corretamente no frontend
5. Em modo automático, o Step 1 (URL) é pulado
6. Tokens são debitados corretamente (mesmo custo do modo manual)
7. O mesmo conteúdo não é reutilizado para o mesmo usuário (últimas 20 gerações)
8. Se não houver conteúdo disponível, a API retorna erro 422 com mensagem clara

---

*FORGE-SMART — PRD v1.0*
*Depende de: pdrshadowfeed.md v1.0 (sistema base)*
