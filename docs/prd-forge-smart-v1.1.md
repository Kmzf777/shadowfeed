# FORGE-SMART — PRD v1.1

> **Feature Codename:** FORGE-SMART v1.1 — Content Quality & Twitter Source
> **Tipo:** Iteração de qualidade sobre FORGE-SMART v1.0
> **Referência anterior:** `docs/prd-forge-smart.md` (v1.0)
> **Status:** Ready for implementation
> **Documento otimizado para execução via Claude Code.**

---

## 1. Diagnóstico — Por que v1.1?

O QA test de `scripts/test-forge-smart.ts` expôs 4 problemas estruturais no pipeline v1.0:

### 1.1 rawContent raso chega na LLM (~80 chars)

A Google News RSS retorna no campo `contentSnippet` apenas o título do artigo + nome da publicação — nunca o corpo do texto. O mapeamento atual em `smart-content-fetcher.ts:21`:

```typescript
summary: item.contentSnippet?.slice(0, 500) ?? null
```

Na prática, `contentSnippet` tem ~60-80 chars (e.g. `"Ivan Teh Fusionex wins... - The Star"`). O campo `rawContent` que chega em Stage 4 (`forgePersonalizedCarousel`) é esse mesmo valor superficial. O LLM está sendo pedido para gerar um carousel de Instagram com 80 chars de contexto — essencialmente fabricando conteúdo a partir do nada.

**Impacto**: Posts gerados são genéricos, superficiais, potencialmente desconectados do artigo real.

### 1.2 Reddit está inativo

`createRedditClient()` retorna `null` quando `REDDIT_CLIENT_ID === 'PLACEHOLDER'`. O ambiente de produção não tem Reddit ativo. A Stage 2 opera com **apenas 1 fonte** (Google News RSS).

### 1.3 relevance scoring hardcoded para AI companies

`scoreNewsRelevance()` em `smart-content-fetcher.ts:36`:

```typescript
if (/chatgpt|openai|google|gemini|claude|anthropic|meta|llama/i.test(title)) score += 2;
```

Isso injeta bias para empresas de IA independente do nicho do usuário. Um personal trainer, advogado ou dono de restaurante recebe relevance_score inflado para artigos sobre ChatGPT que nunca interessam ao seu público.

### 1.4 Scorer recompensa conteúdo vazio como "rico"

`computeRichnessScore()` dá +5 se `summary.length > 100`. Mas os summaries do Google News têm ~60-80 chars — portanto **zero candidatos Google News passam esse threshold**. O richness score máximo para eles é 5 (url:+3, author:+2). Esse erro mascara o problema real do dado vazio.

---

## 2. Objetivos v1.1

1. **Garantir rawContent rico** (2.000-4.000 chars vs ~80 chars atual) — Stage 2.5
2. **Adicionar segunda fonte ativa** via TwitterAPI.io (substitui Reddit inativo)
3. **Remover bias de relevância** — scoring dinâmico baseado no perfil do usuário
4. **Melhorar qualidade do pool** com filtro editorial pre-scoring

---

## 3. Escopo v1.1

### In Scope
- Stage 2.5: Scraping da URL vencedora pós-Stage 3 (maior ROI, menor risco)
- TwitterAPI.io como fonte Stage 2 com thread stitching
- Dynamic relevance scoring baseado em keywords do perfil do usuário
- Editorial quality filter (rejeitar PR fluff, boost de sinais ricos)
- Melhoria no system prompt do Stage 1 para favorecer conteúdo data-rich
- `scraped_body` field no `SmartCandidate` para carregar o artigo scrapeado
- `source_type: 'twitter'` no union type

### Out of Scope v1.1 (v1.2)
- Google Trends API integration
- Multi-source synthesis (top 3 artigos → LLM sintetiza)
- Feedback loop (usuário aprovar conteúdo antes de gerar post)
- Cache de scraping por URL (Redis)
- Agendamento automático de geração

---

## 4. Arquitetura v1.1 — Pipeline Atualizado

```
┌─────────────────────────────────────────────────────────────────┐
│  STAGE 1 — Smart Query Generator  [MODIFICADO]                   │
│                                                                  │
│  Mesmo funcionamento, mas prompt atualizado para:               │
│  • Priorizar queries que encontram artigos com dados/stats       │
│  • Ancoragem temporal ("recent study", "2024 report", etc.)     │
│  • Evitar queries de PR/press release                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  STAGE 2 — Smart Content Fetcher  [MODIFICADO]                   │
│                                                                  │
│  Fontes agora:                                                   │
│  • Google News RSS (já existia)                                  │
│  • TwitterAPI.io  (NOVO — substitui Reddit inativo)             │
│                                                                  │
│  Dynamic relevance scoring: keywords extraídos do perfil         │
│  Editorial filter: rejeitar PR fluff antes do pool              │
│                                                                  │
│  Output: SmartCandidate[] (agora com source_type: 'twitter')    │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  STAGE 3 — Smart Content Scorer  [sem mudança]                   │
│                                                                  │
│  Mesma fórmula. richness score agora funciona corretamente       │
│  pois Twitter threads têm summary real (>100 chars)             │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  STAGE 2.5 — Winner URL Scraper  [NOVO — inserido aqui]          │
│                                                                  │
│  Apenas o candidato vencedor é scrapeado (não todos)            │
│                                                                  │
│  Google News winner:  scrapeBlogUrl(winner.url)                 │
│    → content: 2.000-4.000 chars de artigo real                  │
│  Twitter winner:      thread já contém body via thread stitching │
│    → sem scraping adicional necessário                           │
│                                                                  │
│  winner.scraped_body = ScrapedContent.content (até 4.000 chars) │
│  Timeout: 30s. Em caso de falha: usar summary original          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────────┐
│  STAGE 4 — forge-personalized  [MODIFICADO levemente]            │
│                                                                  │
│  rawContent agora = winner.scraped_body ?? winner.summary        │
│                          ?? winner.title                         │
│                                                                  │
│  2.000-4.000 chars chegam ao LLM em vez de ~80 chars            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Estrutura de Arquivos — Mudanças

```
src/modules/forge-smart/
├── forge-smart.types.ts          # MODIFICAR — add 'twitter', scraped_body
├── smart-query-generator.ts      # MODIFICAR — melhorar system prompt
├── smart-content-fetcher.ts      # MODIFICAR — add Twitter, dynamic scoring, filter
├── smart-content-scorer.ts       # sem mudança
├── smart-winner-scraper.ts       # NOVO — Stage 2.5
└── forge-smart.service.ts        # MODIFICAR — chamar Stage 2.5

src/config/
└── env.ts                        # MODIFICAR — add TWITTERAPI_IO_KEY
```

---

## 6. Modelo de Dados — Mudanças

### 6.1 SmartCandidate (types.ts)

```typescript
export interface SmartCandidate {
  source_type: 'google_news' | 'reddit' | 'twitter';  // add 'twitter'
  title: string;
  summary: string | null;
  url: string | null;
  author: string | null;
  source_score: number | null;     // likes/RTs para Twitter, upvotes para Reddit
  source_comments: number | null;
  posted_at: string | null;
  relevance_score: number;         // 0-10, dinâmico por perfil
  query_used: string;
  scraped_body?: string | null;    // NOVO — preenchido pela Stage 2.5
}
```

### 6.2 Variáveis de ambiente (env.ts)

```typescript
// Adicionar ao schema de env
TWITTERAPI_IO_KEY: z.string().default(''),

// .env.example
TWITTERAPI_IO_KEY=sua_key_aqui  # TwitterAPI.io — $0.15/1k tweets, pay-as-you-go
```

### 6.3 Sem alterações no banco de dados

Nenhuma migration necessária. `generation_method` e `smart_query_used` já existem em `sf_posts` da v1.0.

---

## 7. Stage 1 — Query Generator (melhorias no prompt)

### Problema atual

O prompt atual não instrui o modelo a priorizar tipos de conteúdo que produzem artigos ricos. As queries geradas podem retornar press releases, anúncios corporativos ou opinion pieces vazios.

### Novo system prompt

```typescript
const QUERY_GENERATOR_SYSTEM = `You are a content research specialist and SEO expert.
Given a content creator's profile, generate search queries to find RICH, DATA-BACKED content.

Return ONLY valid JSON: { "queries": ["query1", "query2", "query3", "query4", "query5"] }

Rules:
- Generate exactly 5 queries
- Each query must have a DISTINCT angle:
  1. trending: what is happening RIGHT NOW in this niche (news, launch, change)
  2. pain: content directly addressing the main pain point with evidence or stories
  3. solution: how-to / actionable tips backed by data or expert opinion
  4. story: real case study, success story, or cautionary tale from this niche
  5. data: statistic, survey result, or research finding from the last 90 days
- Queries in English for maximum coverage
- No special characters, no quotes inside queries
- Maximum 7 words per query
- PREFER queries likely to return articles with: numbers, percentages, study results, expert quotes
- AVOID queries likely to return: press releases, product announcements, generic advice
- Be hyper-specific to the niche — a generic query is a wasted slot`;
```

**Mudança principal**: instrução explícita para preferir conteúdo com dados/evidências e evitar PR.

---

## 8. Stage 2 — Smart Content Fetcher (mudanças)

### 8.1 TwitterAPI.io — nova fonte

**API escolhida**: [TwitterAPI.io](https://twitterapi.io) — proxy Twitter sem conta de desenvolvedor Twitter. Suporta busca avançada e fetch de conversation chains.

**Pricing**: $0.15/1.000 tweets (pay-as-you-go). Custo estimado por geração: ~$0.001 (5 queries × 10 tweets = 50 tweets + thread fetching para candidatos selecionados = ~100 tweets/geração).

**Endpoints usados**:
- `GET https://api.twitterapi.io/twitter/tweet/advanced_search` — busca por query (substitui Reddit search)
- `GET https://api.twitterapi.io/twitter/tweet/conversation_id/{id}` — thread stitching (opcional, apenas para winner)

#### Thread Stitching

O diferencial do Twitter em relação ao Reddit/Google News é o formato de thread: um único tweet pode ser o início de um fio de 10-20 tweets que compõem um artigo completo (tutoriais, análises, casos de uso). Isso pode gerar 1.500-5.000 chars de conteúdo rico.

Thread stitching na Stage 2 (para todos os candidatos Twitter):
- Buscar até 5 self-replies (tweets do mesmo autor respondendo o tweet original)
- Concatenar: `[tweet_1] + "\n\n" + [reply_1] + "\n\n" + [reply_2] + ...`
- Se thread resultar em > 200 chars: usar como `summary`
- Se thread < 200 chars: usar apenas o tweet root como summary

#### Implementação: `fetchTwitterByQuery()`

```typescript
// src/modules/forge-smart/smart-content-fetcher.ts

interface TwitterApiTweet {
  id: string;
  text: string;
  author: { userName: string; name: string };
  likeCount: number;
  retweetCount: number;
  replyCount: number;
  createdAt: string;
  conversationId?: string;
}

async function fetchTwitterByQuery(query: string): Promise<SmartCandidate[]> {
  if (!env.TWITTERAPI_IO_KEY) return [];

  const params = new URLSearchParams({
    query: `${query} -is:retweet lang:en`,
    queryType: 'Top',
  });

  const res = await fetch(
    `https://api.twitterapi.io/twitter/tweet/advanced_search?${params}`,
    {
      headers: {
        'X-API-Key': env.TWITTERAPI_IO_KEY,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    logger.warn({ query, status: res.status }, '[FORGE-SMART:FETCH] TwitterAPI query failed');
    return [];
  }

  const data = await res.json() as { tweets?: TwitterApiTweet[] };
  const tweets = (data.tweets ?? [])
    .filter((t) => t.likeCount >= 20 || t.retweetCount >= 5)
    .slice(0, 5);

  const candidates: SmartCandidate[] = [];

  for (const tweet of tweets) {
    // Basic thread stitching: fetch self-replies if conversationId exists
    let threadContent = tweet.text;
    if (tweet.conversationId && tweet.conversationId !== tweet.id) {
      const thread = await fetchTweetThread(tweet.conversationId, tweet.author.userName);
      if (thread && thread.length > threadContent.length) {
        threadContent = thread;
      }
    }

    const engagementScore = tweet.likeCount + (tweet.retweetCount * 2);

    candidates.push({
      source_type: 'twitter',
      title: tweet.text.slice(0, 200),
      summary: threadContent.length > 100 ? threadContent.slice(0, 2000) : null,
      url: `https://x.com/${tweet.author.userName}/status/${tweet.id}`,
      author: tweet.author.name || tweet.author.userName,
      source_score: engagementScore,
      source_comments: tweet.replyCount,
      posted_at: tweet.createdAt,
      relevance_score: 5.0, // será recalculado pelo dynamic scorer
      query_used: query,
    });
  }

  return candidates;
}

async function fetchTweetThread(conversationId: string, authorUserName: string): Promise<string> {
  // Busca replies do mesmo autor (thread do autor)
  const params = new URLSearchParams({
    query: `conversation_id:${conversationId} from:${authorUserName}`,
    queryType: 'Latest',
  });

  try {
    const res = await fetch(
      `https://api.twitterapi.io/twitter/tweet/advanced_search?${params}`,
      {
        headers: {
          'X-API-Key': env.TWITTERAPI_IO_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!res.ok) return '';

    const data = await res.json() as { tweets?: TwitterApiTweet[] };
    const replies = (data.tweets ?? [])
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, 10);

    return replies.map((t) => t.text).join('\n\n');
  } catch {
    return '';
  }
}
```

### 8.2 Dynamic Relevance Scoring

Substituir `scoreNewsRelevance()` hardcoded por scoring baseado em keywords do perfil.

#### Extração de keywords

```typescript
function extractProfileKeywords(
  target_audience: string,
  main_pain_point: string,
  user_prompt?: string | null
): string[] {
  const combined = [target_audience, main_pain_point, user_prompt ?? ''].join(' ');
  // Tokenize: split por espaço, remove stopwords curtas, lowercase, deduplica
  const stopwords = new Set(['the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in', 'with', 'how', 'que', 'para', 'de', 'do', 'da']);
  const words = combined
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 4 && !stopwords.has(w));
  return [...new Set(words)].slice(0, 15); // top 15 keywords
}
```

#### Novo `scoreNewsRelevance()`

```typescript
function scoreNewsRelevance(title: string, keywords: string[]): number {
  const lower = title.toLowerCase();
  let score = 4.0; // base score

  // Keyword match: +1.5 por hit (max 3 hits)
  let keywordHits = 0;
  for (const kw of keywords) {
    if (lower.includes(kw)) {
      score += 1.5;
      keywordHits++;
      if (keywordHits >= 3) break;
    }
  }

  // Rich content signals: +0.5 cada
  if (/\d+%|\d+x|\$\d+|\d+k\b|\d+ percent/i.test(title)) score += 0.5; // tem número
  if (/study|report|survey|research|data|found|according/i.test(title)) score += 0.5;
  if (/how to|tips|guide|step|strategy|method/i.test(title)) score += 0.3;

  // PR fluff penalty: -2
  if (/announces|pleased to|proud to|excited to|partnership with|proud partner/i.test(title)) score -= 2;

  // Breaking/recency signal: +0.5
  if (/breaking|just|new|launch|released|update/i.test(title)) score += 0.5;

  return Math.max(0, Math.min(score, 10));
}
```

**Mudança na assinatura**: `scoreNewsRelevance(title, keywords)` — recebe keywords extraídas do perfil.

`fetchSmartCandidates()` passa as keywords como parâmetro extra:

```typescript
export async function fetchSmartCandidates(
  queries: string[],
  userId: string,
  profileKeywords: string[]   // NOVO parâmetro
): Promise<SmartCandidate[]>
```

### 8.3 Editorial Quality Filter

Rejeição pré-scoring de candidatos que quase nunca produzem bom conteúdo:

```typescript
function passesEditorialFilter(candidate: SmartCandidate): boolean {
  const title = candidate.title.toLowerCase();

  // Rejeitar: títulos muito curtos (ruído)
  if (candidate.title.trim().length < 15) return false;

  // Rejeitar: PR fluff claro
  const prPatterns = [
    /proud (to|partner|member)/i,
    /pleased to announce/i,
    /we are excited/i,
    /\bsponsored\b/i,
    /\badvertisement\b/i,
    /\bpress release\b/i,
  ];
  if (prPatterns.some((re) => re.test(title))) return false;

  // Rejeitar: paywall sinalizados
  if (/\[paywall\]|\(paywall\)|subscriber.only/i.test(title)) return false;

  return true;
}
```

Aplicado como `.filter(passesEditorialFilter)` antes de `deduplicateByTitle()` em `fetchSmartCandidates()`.

---

## 9. Stage 2.5 — Winner URL Scraper (NOVO)

### Arquivo: `smart-winner-scraper.ts`

Este módulo é inserido **entre Stage 3 e Stage 4** no `forge-smart.service.ts`. Recebe o candidato vencedor e enriquece o campo `scraped_body`.

### Lógica

```typescript
// src/modules/forge-smart/smart-winner-scraper.ts

import { scrapeBlogUrl } from '../manual-news/url-scraper.js';
import { logger } from '../../config/logger.js';
import type { SmartCandidateScored } from './forge-smart.types.js';

/**
 * Tenta scraping real do artigo vencedor.
 * Retorna winner enriquecido com scraped_body.
 * Em caso de falha (timeout, bloqueio, paywall), mantém winner original.
 */
export async function enrichWinnerWithScrapedBody(
  winner: SmartCandidateScored
): Promise<SmartCandidateScored> {
  // Twitter candidates: thread stitching já foi feito no Stage 2
  // summary já contém o conteúdo completo da thread — não precisa scraping adicional
  if (winner.source_type === 'twitter') {
    logger.info({ winner: winner.title }, '[FORGE-SMART:SCRAPE] Twitter winner — using thread content');
    return winner;
  }

  // Google News: summary é título (~80 chars) — scrape a URL real
  if (!winner.url) {
    logger.warn({ winner: winner.title }, '[FORGE-SMART:SCRAPE] No URL to scrape — using summary fallback');
    return winner;
  }

  logger.info({ winner: winner.title, url: winner.url }, '[FORGE-SMART:SCRAPE] Scraping winner URL');

  try {
    const scraped = await scrapeBlogUrl(winner.url);  // usa o Puppeteer existente

    if (scraped.content && scraped.content.length > 200) {
      logger.info(
        { contentLength: scraped.content.length, winner: winner.title },
        '[FORGE-SMART:SCRAPE] Scraped successfully'
      );
      return { ...winner, scraped_body: scraped.content };
    }

    logger.warn({ winner: winner.title }, '[FORGE-SMART:SCRAPE] Scraped but content too short — fallback');
    return winner;
  } catch (err) {
    logger.warn(
      { winner: winner.title, error: (err as Error).message },
      '[FORGE-SMART:SCRAPE] Scraping failed — using summary fallback'
    );
    return winner; // graceful fallback: nunca quebra o pipeline
  }
}
```

**Nota**: `scrapeBlogUrl()` existe em `src/modules/manual-news/url-scraper.ts:147`. Ela usa Puppeteer com timeout 30s, extrai até 4.000 chars de article body. Apenas essa função é reutilizada — não a `scrapeUrl()` geral (que faria branch para reddit/twitter desnecessariamente).

### Integração em `forge-smart.service.ts`

```typescript
// Entre Stage 3 e Stage 4
import { enrichWinnerWithScrapedBody } from './smart-winner-scraper.js';

// ... (após selectBestCandidate)
const winner = selectBestCandidate(candidates);

// ── Stage 2.5: URL Scraping ───────────────────────────────────
logger.info({ userId, winner: winner.title }, '[FORGE-SMART] Stage 2.5 — enriching winner');
const enrichedWinner = await enrichWinnerWithScrapedBody(winner);

// ── Stage 4 ───────────────────────────────────────────────────
const post = await forgePersonalizedCarousel({
  title: enrichedWinner.title,
  summary: enrichedWinner.scraped_body ?? enrichedWinner.summary ?? undefined,
  rawContent: enrichedWinner.scraped_body ?? enrichedWinner.summary ?? enrichedWinner.title,
  // ...
});
```

### Timeout Strategy

`scrapeBlogUrl()` já tem `timeout: 30000` (30s) no Puppeteer. Dentro do pipeline fire-and-forget (202 imediato), esse delay é aceitável — o usuário já está na tela `/my-posts?generating=true`.

---

## 10. Ajustes em `forge-smart.service.ts`

```typescript
// Extrair keywords do perfil ANTES de fetchSmartCandidates
import { extractProfileKeywords } from './smart-content-fetcher.js';

// Stage 1 (sem mudança)
const queries = await generateSmartQueries({ ... });

// Extrair keywords do perfil para dynamic relevance scoring
const profileKeywords = extractProfileKeywords(
  userProfile.target_audience,
  userProfile.main_pain_point,
  userProfile.user_prompt
);

// Stage 2 (novo parâmetro)
const candidates = await fetchSmartCandidates(queries, userId, profileKeywords);

// Stage 3 (sem mudança)
const winner = selectBestCandidate(candidates);

// Stage 2.5 (NOVO)
const enrichedWinner = await enrichWinnerWithScrapedBody(winner);

// Stage 4 (rawContent atualizado)
const post = await forgePersonalizedCarousel({
  title:      enrichedWinner.title,
  summary:    enrichedWinner.scraped_body ?? enrichedWinner.summary ?? undefined,
  rawContent: enrichedWinner.scraped_body ?? enrichedWinner.summary ?? enrichedWinner.title,
  ...
});
```

---

## 11. Logs Estruturados — Novos Eventos

```typescript
// Stage 2.5 — SCRAPE
logger.info({ userId, source: winner.source_type, url: winner.url, bodyLength: enrichedWinner.scraped_body?.length ?? 0 }, '[FORGE-SMART:SCRAPE] Winner enriched');

// Stage 2 — TWITTER
logger.info({ query, tweetCount: tweets.length, threadFetched: ... }, '[FORGE-SMART:FETCH] Twitter query completed');

// Stage 2 — FILTER
logger.info({ before: allCandidates.length, afterFilter: filtered.length, rejected: allCandidates.length - filtered.length }, '[FORGE-SMART:FILTER] Editorial filter applied');
```

---

## 12. Configuração — `.env.example` (adições)

```bash
# ─── TwitterAPI.io ───────────────────────────────────────────────
TWITTERAPI_IO_KEY=             # Required for Stage 2 Twitter source
                               # Get at: https://twitterapi.io
                               # Pricing: $0.15/1k tweets, pay-as-you-go
                               # Leave empty to disable Twitter source (Google News only)
```

---

## 13. Riscos e Mitigações

| Risco | Prob | Impacto | Mitigação |
|---|---|---|---|
| Artigo vencedor bloqueado (paywall, Cloudflare) | Alta (30-40%) | Médio | Graceful fallback para summary original — pipeline nunca quebra |
| TwitterAPI.io API key ausente | Baixa (env var) | Baixo | `if (!env.TWITTERAPI_IO_KEY) return []` — Google News funciona sozinho |
| Thread fetching lento (2x API calls por tweet) | Média | Médio | Limitar a 5 tweets por query; thread stitching apenas para tweets com conversationId |
| Dynamic keywords muito genéricas ("entrepreneur", "business") | Média | Médio | Score base 4.0 → keyword hits são bônus, não requisito; resultado é pelo menos tão bom quanto v1.0 |
| Stage 2.5 adiciona 10-30s ao tempo total | Certa | Baixo | Pipeline é fire-and-forget (202 imediato) — usuário não sente |
| Twitter candidate ganha Stage 3 mas thread é superficial | Baixa | Baixo | Stage 2.5 detecta `source_type === 'twitter'` e não tenta scraping duplo |

---

## 14. Stories de Implementação

### Story 1 — Types + Env (0.5h)

**Arquivo**: `forge-smart.types.ts`, `config/env.ts`, `.env.example`

Mudanças:
- `SmartCandidate.source_type`: adicionar `'twitter'` ao union
- `SmartCandidate.scraped_body?: string | null` — campo opcional
- `env.ts`: adicionar `TWITTERAPI_IO_KEY: z.string().default('')`
- `.env.example`: documentar nova variável

**AC**: TypeScript compila sem erros; `env.TWITTERAPI_IO_KEY` acessível.

---

### Story 2 — Stage 1 Prompt Improvement (0.5h)

**Arquivo**: `smart-query-generator.ts`

Mudanças:
- Substituir `QUERY_GENERATOR_SYSTEM` conforme seção 7
- Sem mudança na assinatura ou no retorno

**AC**: Queries geradas incluem ao menos 1 com signal temporal ("study", "research", "report") e 1 com ângulo de dados. Verificar via `scripts/test-forge-smart.ts`.

---

### Story 3 — Dynamic Relevance + Editorial Filter (1.5h)

**Arquivo**: `smart-content-fetcher.ts`

Mudanças:
- Adicionar `extractProfileKeywords(target_audience, main_pain_point, user_prompt): string[]` (export)
- Refatorar `scoreNewsRelevance(title, keywords[])` — remover hardcoded AI keywords
- Adicionar `passesEditorialFilter(candidate): boolean`
- Atualizar `fetchSmartCandidates(queries, userId, profileKeywords)` para aceitar e usar keywords

**AC**:
- Artigos de AI companies não recebem score inflado para nicho de fitness ou advocacia
- Artigos com "announced partnership" são rejeitados
- Artigos com "% increase" ou "study finds" recebem score >= 6.5

---

### Story 4 — TwitterAPI.io Source (2h)

**Arquivo**: `smart-content-fetcher.ts`

Mudanças:
- Adicionar `fetchTwitterByQuery(query, profileKeywords): Promise<SmartCandidate[]>`
- Adicionar `fetchTweetThread(conversationId, authorUserName): Promise<string>`
- Integrar no `fetchSmartCandidates()`: `if (env.TWITTERAPI_IO_KEY) fetchPromises.push(fetchTwitterByQuery(query, profileKeywords))`

**AC**:
- Com TWITTERAPI_IO_KEY configurada: candidatos `source_type: 'twitter'` aparecem no pool
- Tweets com >= 20 likes são incluídos
- Threads com > 200 chars aparecem como summary do candidato
- Sem TWITTERAPI_IO_KEY: Twitter silenciosamente ignorado, Google News funciona normalmente

---

### Story 5 — Stage 2.5 Winner Scraper (1.5h)

**Arquivo**: `smart-winner-scraper.ts` (NOVO), `forge-smart.service.ts` (MODIFICAR)

Mudanças:
- Criar `smart-winner-scraper.ts` conforme seção 9
- Atualizar `forge-smart.service.ts` para chamar `enrichWinnerWithScrapedBody(winner)` entre Stage 3 e Stage 4
- Atualizar Stage 4 call para usar `enrichedWinner.scraped_body` como rawContent priority

**AC**:
- Winner com URL de blog tem `scraped_body` com >= 500 chars
- Winner Twitter mantém `summary` como source (sem double-scraping)
- Falha de scraping não quebra pipeline — fallback para summary/title
- Log `[FORGE-SMART:SCRAPE]` aparece com `bodyLength` preenchido

---

### Story 6 — Atualizar `scripts/test-forge-smart.ts` (0.5h)

**Arquivo**: `scripts/test-forge-smart.ts`

Mudanças:
- Atualizar chamada de `fetchSmartCandidates` para passar `profileKeywords`
- Mostrar `scraped_body` length no output Stage 3/4
- Adicionar coluna `src` para distinguir `news`/`twitter`/`reddit` na tabela de scoring

**AC**: Script executa sem TypeScript errors, mostra candidatos Twitter quando configurado.

---

## 15. Critérios de Aceite da Feature

1. **rawContent rico**: `enrichedWinner.scraped_body` tem >= 500 chars para artigos de blog escrapeáveis
2. **rawContent fallback**: Pipeline nunca lança erro por falha de scraping — usa summary/title graciosamente
3. **Twitter ativo**: Com `TWITTERAPI_IO_KEY`, candidatos Twitter aparecem no pool; pool total aumenta ~30-50%
4. **Relevance scoring correto**: Artigo sobre "ChatGPT news" em nicho de restaurantes não recebe score > 6
5. **PR filter funcionando**: Títulos com "proud to announce" ou "pleased to share" são rejeitados do pool
6. **Stage 1 queries melhoradas**: Ao menos 1 query por geração contém sinal de dados/evidência
7. **TypeScript clean**: Nenhum erro novo além dos pre-existing de `twitter.source.ts` (playwright deps)
8. **Tempo total tolerável**: Pipeline completa em < 90s (fire-and-forget — usuário não percebe)
9. **Observabilidade**: Todos os novos logs `[FORGE-SMART:SCRAPE]`, `[FORGE-SMART:FILTER]` aparecem no console

---

## 16. Comparativo v1.0 vs v1.1

| Dimensão | v1.0 | v1.1 |
|---|---|---|
| rawContent para LLM | ~80 chars (título RSS) | 500-4.000 chars (artigo scrapeado) |
| Fontes ativas | 1 (Google News) | 2 (Google News + Twitter) |
| Relevance scoring | Hardcoded AI keywords | Dinâmico por perfil do usuário |
| Filtro editorial | Nenhum | PR fluff rejection + length filter |
| Thread content | N/A | Twitter threads stitched (1.500-5.000 chars) |
| Qualidade estimada do post | "Parece IA fabricando" | "Parece pesquisa real do dono do negócio" |

---

## 17. Fora do Escopo — Roadmap v1.2

- **Google Trends calibration**: Correlacionar queries com trends do Google Trends API (gratuito) para time-anchor das queries ao momento atual
- **Multi-source synthesis**: Scraping top-3 candidatos → LLM sintetiza um briefing combinado → rawContent de 3 perspectivas diferentes
- **Supabase cache de scraping**: Cachear `scraped_body` por URL + TTL 24h para evitar re-scraping de artigos populares
- **Quality scoring feedback loop**: Usuário pode marcar post gerado como "ruim" → alimenta blacklist de queries/fontes

---

*FORGE-SMART — PRD v1.1*
*Depende de: prd-forge-smart.md v1.0 (sistema base já implementado)*
*Data: 2026-02-18*
