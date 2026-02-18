# FORGE-SMART — Stories de Implementação v1.0

> **Referência:** `docs/prd-forge-smart.md`
> **Ordem de execução:** Stories 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8
> **Dependências externas:** nenhuma nova (reutiliza snoowrap, rss-parser, openai já instalados)

---

## STORY 1 — Tipos e Interfaces do Módulo

**Arquivo a criar:** `src/modules/forge-smart/forge-smart.types.ts`

**Descrição:** Definir todos os tipos TypeScript do módulo antes de qualquer implementação. Sem lógica — apenas interfaces e types.

**Implementação completa:**

```typescript
// src/modules/forge-smart/forge-smart.types.ts

export interface SmartQueryGeneratorInput {
  target_audience: string;
  main_pain_point: string;
  voice_tone: string;
  user_prompt?: string | null;
}

export interface SmartCandidate {
  source_type: 'google_news' | 'reddit';
  title: string;
  summary: string | null;
  url: string | null;
  author: string | null;
  source_score: number | null;
  source_comments: number | null;
  posted_at: string | null;       // ISO 8601 string ou null
  relevance_score: number;        // 0-10
  query_used: string;             // qual das 5 queries gerou este item
}

export interface SmartCandidateScored extends SmartCandidate {
  final_score: number;            // 0-10, resultado da fórmula de scoring
}

export interface ForgeSmartRequest {
  userId: string;
  themeId: string;
  modelConfigId?: string;
  productMode?: boolean;
  productDescription?: string;
  ctaText?: string;
}
```

**Critério de aceite:**
- [ ] Arquivo existe em `src/modules/forge-smart/forge-smart.types.ts`
- [ ] Sem erros de TypeScript (`tsc --noEmit`)

---

## STORY 2 — Smart Query Generator (Stage 1)

**Arquivo a criar:** `src/modules/forge-smart/smart-query-generator.ts`

**Descrição:** Dado o perfil do usuário, gera 5 queries de busca diversas usando OpenAI (gpt-4o-mini). Cada query tem um ângulo distinto (trending, dor, solução, história, dados).

**Dependências:** `../../config/openai.js`, `../../config/logger.js`, `./forge-smart.types.js`

**Implementação completa:**

```typescript
// src/modules/forge-smart/smart-query-generator.ts

import OpenAI from 'openai';
import { openai } from '../../config/openai.js';
import { logger } from '../../config/logger.js';
import type { SmartQueryGeneratorInput } from './forge-smart.types.js';
import { z } from 'zod';

const QueryOutputSchema = z.object({
  queries: z.array(z.string().min(3).max(80)).min(3).max(7),
});

const QUERY_GENERATOR_SYSTEM = `You are a content research specialist and SEO expert.
Given a content creator's profile, generate search queries to find relevant news and posts.

Return ONLY valid JSON: { "queries": ["query1", "query2", "query3", "query4", "query5"] }

Rules:
- Generate exactly 5 queries
- Each query must have a DISTINCT angle:
  1. trending: what is happening RIGHT NOW in this niche
  2. pain: content directly addressing the main_pain_point
  3. solution: how-to / actionable tips for the audience
  4. story: real case study or example in this niche
  5. data: statistic, research, or study relevant to the niche
- Queries in English for maximum coverage
- No special characters, no quotes inside queries
- Maximum 7 words per query
- Be specific to the niche, not generic`;

export async function generateSmartQueries(
  input: SmartQueryGeneratorInput
): Promise<string[]> {
  const userMessage = `Content creator profile:
- Target audience: ${input.target_audience}
- Main pain point: ${input.main_pain_point}
- Voice tone: ${input.voice_tone}
- Business context: ${input.user_prompt ?? 'Not specified'}

Generate 5 diverse search queries to find relevant content for this creator's audience.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_completion_tokens: 512,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: QUERY_GENERATOR_SYSTEM },
        { role: 'user', content: userMessage },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? '{}';
    const parsed = JSON.parse(raw);
    const validated = QueryOutputSchema.parse(parsed);

    logger.info(
      { queries: validated.queries, targetAudience: input.target_audience },
      '[FORGE-SMART:QUERY] Queries generated'
    );

    return validated.queries;
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[FORGE-SMART:QUERY] Query generation failed');
    // Fallback: usar campos do perfil diretamente como queries
    return [
      input.main_pain_point,
      `${input.target_audience} tips`,
      `how to help ${input.target_audience}`,
    ].filter(Boolean);
  }
}
```

**Critério de aceite:**
- [ ] Retorna entre 3-5 strings quando chamado com perfil válido
- [ ] Fallback funciona quando OpenAI falha (queries derivadas do perfil)
- [ ] Logs estruturados com `[FORGE-SMART:QUERY]` prefix
- [ ] Sem erros de TypeScript

---

## STORY 3 — Smart Content Fetcher (Stage 2)

**Arquivo a criar:** `src/modules/forge-smart/smart-content-fetcher.ts`

**Descrição:** Busca conteúdo nas fontes disponíveis (Google News RSS + Reddit) para cada query gerada. Fetch paralelo. Deduplicação de títulos. Filtragem de conteúdo já usado pelo usuário.

**Dependências:** `rss-parser`, `snoowrap`, `../../config/env.js`, `../../config/logger.js`, `../../config/supabase.js`, `./forge-smart.types.js`

**Implementação completa:**

```typescript
// src/modules/forge-smart/smart-content-fetcher.ts

import RSSParser from 'rss-parser';
import Snoowrap from 'snoowrap';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { supabase } from '../../config/supabase.js';
import type { SmartCandidate } from './forge-smart.types.js';

const rssParser = new RSSParser();

// ─── Google News (parametrizado por query) ──────────────────────

async function fetchGoogleNewsByQuery(query: string): Promise<SmartCandidate[]> {
  const encoded = encodeURIComponent(query);
  const feedUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;

  try {
    const feed = await rssParser.parseURL(feedUrl);
    return feed.items.slice(0, 8).map((item) => ({
      source_type: 'google_news' as const,
      title: item.title ?? '',
      summary: item.contentSnippet?.slice(0, 500) ?? null,
      url: item.link ?? null,
      author: item.creator ?? null,
      source_score: null,
      source_comments: null,
      posted_at: item.isoDate ?? null,
      relevance_score: scoreNewsRelevance(item.title ?? ''),
      query_used: query,
    })).filter((c) => c.title.length >= 5);
  } catch (err) {
    logger.warn({ query, error: (err as Error).message }, '[FORGE-SMART:FETCH] Google News query failed');
    return [];
  }
}

function scoreNewsRelevance(title: string): number {
  let score = 5.0;
  if (/chatgpt|openai|google|gemini|claude|anthropic|meta|llama/i.test(title)) score += 2;
  if (/breaking|just|new|launch|releas/i.test(title)) score += 1;
  if (/brasil|português|br\b/i.test(title)) score += 0.5;
  return Math.min(score, 10);
}

// ─── Reddit Search (parametrizado por query) ────────────────────

function createRedditClient(): Snoowrap | null {
  if (!env.REDDIT_CLIENT_ID || env.REDDIT_CLIENT_ID === 'PLACEHOLDER') {
    return null;
  }
  return new Snoowrap({
    userAgent: 'SHADOWFEED/1.0 (smart content discovery)',
    clientId: env.REDDIT_CLIENT_ID,
    clientSecret: env.REDDIT_CLIENT_SECRET,
    username: env.REDDIT_USERNAME,
    password: env.REDDIT_PASSWORD,
  });
}

async function fetchRedditByQuery(
  reddit: Snoowrap,
  query: string
): Promise<SmartCandidate[]> {
  try {
    // Busca global no Reddit, não restrito a subreddits
    const results = await reddit.search({
      query,
      sort: 'relevance',
      time: 'week',
      limit: 10,
    });

    return results
      .filter((post: any) => post.score >= 50 && !post.stickied)
      .slice(0, 5)
      .map((post: any) => ({
        source_type: 'reddit' as const,
        title: post.title,
        summary: post.selftext?.slice(0, 500) || null,
        url: post.url?.startsWith('/r/')
          ? `https://reddit.com${post.url}`
          : post.url,
        author: post.author?.name ?? null,
        source_score: post.score,
        source_comments: post.num_comments,
        posted_at: null, // snoowrap retorna created_utc (number), mas ignoramos para simplificar
        relevance_score: scoreRedditRelevance(post.score, post.num_comments),
        query_used: query,
      }));
  } catch (err) {
    logger.warn({ query, error: (err as Error).message }, '[FORGE-SMART:FETCH] Reddit query failed');
    return [];
  }
}

function scoreRedditRelevance(score: number, comments: number): number {
  let relevance = 5.0;
  if (score > 1000) relevance += 2;
  else if (score > 500) relevance += 1.5;
  else if (score > 200) relevance += 1;
  if (comments > 100) relevance += 1;
  return Math.min(relevance, 10);
}

// ─── Deduplication helpers ──────────────────────────────────────

function deduplicateByTitle(items: SmartCandidate[]): SmartCandidate[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function getRecentlyUsedTitles(userId: string): Promise<Set<string>> {
  try {
    const { data } = await supabase
      .from('sf_posts')
      .select('smart_query_used')
      .eq('user_id', userId)
      .eq('generation_method', 'smart')
      .not('smart_query_used', 'is', null)
      .order('created_at', { ascending: false })
      .limit(20);

    const usedTitles = new Set<string>();
    (data ?? []).forEach((row: any) => {
      if (row.smart_query_used) {
        usedTitles.add(row.smart_query_used.toLowerCase().slice(0, 60));
      }
    });
    return usedTitles;
  } catch {
    return new Set();
  }
}

// ─── Main export ─────────────────────────────────────────────────

export async function fetchSmartCandidates(
  queries: string[],
  userId: string
): Promise<SmartCandidate[]> {
  const reddit = createRedditClient();

  // Fetch paralelo: todas as queries em todas as fontes simultaneamente
  const fetchPromises: Promise<SmartCandidate[]>[] = [];
  for (const query of queries) {
    fetchPromises.push(fetchGoogleNewsByQuery(query));
    if (reddit) fetchPromises.push(fetchRedditByQuery(reddit, query));
  }

  const results = await Promise.allSettled(fetchPromises);
  const allCandidates: SmartCandidate[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      allCandidates.push(...result.value);
    }
  }

  // Dedup interno
  const deduplicated = deduplicateByTitle(allCandidates);

  // Dedup por conteúdo já usado pelo usuário
  const usedTitles = await getRecentlyUsedTitles(userId);
  const filtered = deduplicated.filter((c) => {
    const key = c.title.toLowerCase().slice(0, 60);
    return !usedTitles.has(key);
  });

  logger.info(
    { userId, raw: allCandidates.length, afterDedup: deduplicated.length, afterFilter: filtered.length },
    '[FORGE-SMART:FETCH] Candidates collected'
  );

  return filtered;
}
```

**Critério de aceite:**
- [ ] Fetch paralelo funciona (`Promise.allSettled` não lança exceção global)
- [ ] Sem Reddit configurado: apenas Google News é usado, sem erro
- [ ] Deduplicação por título remove duplicatas da mesma notícia em fontes diferentes
- [ ] Candidatos com títulos de posts `smart_query_used` recentes do usuário são excluídos
- [ ] Logs com `[FORGE-SMART:FETCH]` prefix

---

## STORY 4 — Smart Content Scorer (Stage 3)

**Arquivo a criar:** `src/modules/forge-smart/smart-content-scorer.ts`

**Descrição:** Recebe o pool de candidatos e seleciona o de maior score composto. Score = weighted average de recency, engagement, relevance e content richness.

**Dependências:** `../../config/logger.js`, `./forge-smart.types.js`

**Implementação completa:**

```typescript
// src/modules/forge-smart/smart-content-scorer.ts

import { logger } from '../../config/logger.js';
import type { SmartCandidate, SmartCandidateScored } from './forge-smart.types.js';

// ─── Recency score (0-10) ─────────────────────────────────────

function computeRecencyScore(posted_at: string | null): number {
  if (!posted_at) return 2; // Sem data = penalidade leve
  const diffMs = Date.now() - new Date(posted_at).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 6) return 10;
  if (diffHours < 24) return 8;
  if (diffHours < 48) return 6;
  if (diffHours < 168) return 4; // 7 dias
  return 2;
}

// ─── Engagement score (0-10) ─────────────────────────────────

function computeEngagementScore(source_score: number | null): number {
  if (!source_score) return 2;
  if (source_score > 5000) return 10;
  if (source_score > 1000) return 8;
  if (source_score > 500) return 6;
  if (source_score > 100) return 4;
  return 2;
}

// ─── Content richness score (0-10) ───────────────────────────

function computeRichnessScore(candidate: SmartCandidate): number {
  let score = 0;
  if (candidate.summary && candidate.summary.length > 100) score += 5;
  if (candidate.url && candidate.url.startsWith('http')) score += 3;
  if (candidate.author) score += 2;
  return score;
}

// ─── Final score formula ──────────────────────────────────────

function computeFinalScore(candidate: SmartCandidate): number {
  const recency = computeRecencyScore(candidate.posted_at);
  const engagement = computeEngagementScore(candidate.source_score);
  const relevance = candidate.relevance_score;      // 0-10 já normalizado
  const richness = computeRichnessScore(candidate);

  return (recency * 0.40) + (engagement * 0.30) + (relevance * 0.20) + (richness * 0.10);
}

// ─── Main export ─────────────────────────────────────────────

export function selectBestCandidate(
  candidates: SmartCandidate[]
): SmartCandidateScored {
  if (candidates.length === 0) {
    throw new Error('[FORGE-SMART] No candidates available for scoring');
  }

  const scored: SmartCandidateScored[] = candidates.map((c) => ({
    ...c,
    final_score: computeFinalScore(c),
  }));

  // Ordena descrescente por final_score
  scored.sort((a, b) => b.final_score - a.final_score);

  const winner = scored[0];

  logger.info(
    {
      winner: winner.title,
      score: winner.final_score.toFixed(2),
      source: winner.source_type,
      query: winner.query_used,
      totalCandidates: candidates.length,
    },
    '[FORGE-SMART:SCORE] Winner selected'
  );

  return winner;
}
```

**Critério de aceite:**
- [ ] Com 1 candidato: retorna esse candidato
- [ ] Com múltiplos: retorna o de maior `final_score`
- [ ] Com 0 candidatos: lança `Error('[FORGE-SMART] No candidates available...')`
- [ ] Sem erros de TypeScript

---

## STORY 5 — Forge Smart Service (Orquestrador)

**Arquivo a criar:** `src/modules/forge-smart/forge-smart.service.ts`

**Descrição:** Orquestra os 4 stages. Valida usuário, gera queries, busca conteúdo, seleciona melhor candidato, chama `forgePersonalizedCarousel`, e atualiza o post com metadados do modo smart.

**Dependências:** Todos os módulos das Stories 1-4, `../forge-personalized/forge-personalized.service.js`, `../../config/supabase.js`, `../../config/logger.js`, `../credits/credits.service.js`

**Implementação completa:**

```typescript
// src/modules/forge-smart/forge-smart.service.ts

import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { generateSmartQueries } from './smart-query-generator.js';
import { fetchSmartCandidates } from './smart-content-fetcher.js';
import { selectBestCandidate } from './smart-content-scorer.js';
import { forgePersonalizedCarousel } from '../forge-personalized/forge-personalized.service.js';
import { hasEnoughTokens } from '../credits/credits.service.js';
import type { ForgeSmartRequest } from './forge-smart.types.js';
import type { GeneratedPost } from '../../shared/types/global.types.js';

async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('target_audience, main_pain_point, voice_tone, user_prompt, setup_completed')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('[FORGE-SMART] User profile not found');
  }
  return data;
}

export async function forgeSmartCarousel(
  request: ForgeSmartRequest
): Promise<GeneratedPost> {
  const { userId, themeId, productMode, productDescription, ctaText } = request;
  const startTime = Date.now();

  logger.info({ userId, themeId }, '[FORGE-SMART] Starting smart generation');

  // ── Validações iniciais ──────────────────────────────────────

  const userProfile = await getUserProfile(userId);

  if (!userProfile.setup_completed) {
    throw new Error('[FORGE-SMART] User must complete setup before using smart generation');
  }

  if (!userProfile.target_audience || !userProfile.main_pain_point) {
    throw new Error('[FORGE-SMART] User profile incomplete: target_audience and main_pain_point are required');
  }

  // Verificar tokens (mesma lógica do forge-personalized)
  const tokenCheck = await hasEnoughTokens(userId, themeId, !!productMode);
  if (!tokenCheck.enough) {
    throw new Error(
      `[FORGE-SMART] Insufficient tokens: has ${tokenCheck.planRemaining + (tokenCheck.freeTokens ?? 0) + tokenCheck.extraTokens}, needs ${tokenCheck.required}`
    );
  }

  // ── Stage 1: Query Generation ────────────────────────────────

  const queries = await generateSmartQueries({
    target_audience: userProfile.target_audience,
    main_pain_point: userProfile.main_pain_point,
    voice_tone: userProfile.voice_tone ?? 'professional',
    user_prompt: userProfile.user_prompt,
  });

  // ── Stage 2: Content Fetch ────────────────────────────────────

  const candidates = await fetchSmartCandidates(queries, userId);

  if (candidates.length === 0) {
    throw new Error('[FORGE-SMART] No suitable content found for your audience. Try again in a few minutes.');
  }

  // ── Stage 3: Content Scoring ──────────────────────────────────

  const winner = selectBestCandidate(candidates);

  // ── Stage 4: Forge Personalized (existente) ───────────────────

  const post = await forgePersonalizedCarousel({
    // Sem URL — conteúdo já coletado
    title: winner.title,
    summary: winner.summary ?? undefined,
    rawContent: winner.summary ?? winner.title,
    category: undefined,
    themeId,
    userId,
    productMode,
    productDescription,
    ctaText,
  });

  // ── Atualizar metadados do modo smart ─────────────────────────

  await supabase
    .from('sf_posts')
    .update({
      generation_method: 'smart',
      smart_query_used: winner.query_used,
    })
    .eq('id', post.id);

  const totalMs = Date.now() - startTime;

  logger.info(
    {
      postId: post.id,
      userId,
      themeId,
      winner: winner.title,
      winnerScore: winner.final_score,
      totalMs,
    },
    '[FORGE-SMART] Smart generation completed'
  );

  return post;
}
```

**Critério de aceite:**
- [ ] Fluxo completo funciona end-to-end (query → fetch → score → forge)
- [ ] Usuário sem `setup_completed` recebe erro antes de consumir tokens
- [ ] Usuário sem tokens recebe erro antes de processar
- [ ] O post criado tem `generation_method = 'smart'` e `smart_query_used` preenchido no DB
- [ ] Se Stage 2 retornar 0 candidatos, erro 422 com mensagem clara
- [ ] Logs cobrem todos os stages

---

## STORY 6 — Controller e Registro de Rota

**Arquivos a criar/modificar:**
- `src/modules/forge-smart/forge-smart.controller.ts` ← criar
- `src/routes/index.ts` ← modificar (adicionar rota)

**Descrição:** Expõe `POST /api/forge-smart/generate` no padrão fire-and-forget (retorna 202 imediatamente, processa em background). Mesmo padrão do `forge-personalized.controller.ts`.

**`forge-smart.controller.ts` — Implementação completa:**

```typescript
// src/modules/forge-smart/forge-smart.controller.ts

import { Router, type Request, type Response } from 'express';
import { logger } from '../../config/logger.js';
import { forgeSmartCarousel } from './forge-smart.service.js';
import type { ForgeSmartRequest } from './forge-smart.types.js';

const router = Router();

router.post('/generate', async (req: Request, res: Response) => {
  const body = req.body as ForgeSmartRequest;

  // Validação básica de campos obrigatórios
  if (!body.userId || !body.themeId) {
    res.status(400).json({ error: 'userId and themeId are required' });
    return;
  }

  // Fire-and-forget: retorna 202 imediatamente
  res.status(202).json({ success: true, message: 'Smart generation started' });

  // Processa em background
  forgeSmartCarousel(body).catch((err: Error) => {
    logger.error(
      { userId: body.userId, themeId: body.themeId, error: err.message },
      '[FORGE-SMART] Background generation failed'
    );
  });
});

export default router;
```

**Modificação em `src/routes/index.ts`:**

Localizar o bloco de imports existente e adicionar após o último `import`:
```typescript
import forgeSmartRouter from '../modules/forge-smart/forge-smart.controller.js';
```

Localizar o bloco de `router.use(...)` e adicionar:
```typescript
router.use('/forge-smart', forgeSmartRouter);
```

**Critério de aceite:**
- [ ] `POST /api/forge-smart/generate` com `{ userId, themeId }` retorna HTTP 202 em < 300ms
- [ ] `POST /api/forge-smart/generate` sem `userId` retorna HTTP 400
- [ ] Erro no processamento background é logado, mas não derruba o servidor
- [ ] Rota aparece no `src/routes/index.ts` junto com as outras

---

## STORY 7 — Migração de Banco de Dados

**Onde executar:** Supabase Dashboard → SQL Editor

**Descrição:** Adicionar as colunas `generation_method` e `smart_query_used` à tabela `sf_posts`. Deve ser executado ANTES de fazer deploy da feature.

**SQL completo (executar no Supabase):**

```sql
-- Migration: FORGE-SMART support columns
-- Execute in: Supabase Dashboard > SQL Editor

ALTER TABLE sf_posts
  ADD COLUMN IF NOT EXISTS generation_method TEXT DEFAULT 'manual'
    CHECK (generation_method IN ('manual', 'smart')),
  ADD COLUMN IF NOT EXISTS smart_query_used TEXT;

-- Índice para analytics futuros por método de geração
CREATE INDEX IF NOT EXISTS idx_sf_posts_generation_method
  ON sf_posts(user_id, generation_method, created_at DESC);

-- Comentários para documentação
COMMENT ON COLUMN sf_posts.generation_method IS 'manual = URL fornecida pelo usuário; smart = FORGE-SMART auto-discovery';
COMMENT ON COLUMN sf_posts.smart_query_used IS 'Query de busca que originou o conteúdo no modo FORGE-SMART';
```

**Verificação pós-migração:**

```sql
-- Verificar que as colunas foram criadas
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'sf_posts'
  AND column_name IN ('generation_method', 'smart_query_used');
-- Esperado: 2 linhas retornadas

-- Verificar constraint
SELECT pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'sf_posts'::regclass
  AND conname LIKE '%generation_method%';
```

**Critério de aceite:**
- [ ] Colunas existem na tabela `sf_posts`
- [ ] `generation_method` tem `DEFAULT 'manual'` e constraint `CHECK`
- [ ] Posts existentes têm `generation_method = 'manual'` (default aplicado retroativamente)
- [ ] Índice criado

---

## STORY 8 — Frontend: Toggle Manual / Automático

**Arquivo a modificar:** `web/src/app/criar-post/page.tsx`

**Descrição:** Adicionar um toggle de modo (manual/auto) na página de criação de posts. Em modo automático, o Step 1 (URL) é substituído por um card informativo e o form submete para o novo endpoint.

**Mudanças necessárias no `page.tsx`:**

### 8.1 — Adicionar estado de modo

Após a declaração dos estados existentes, adicionar:

```typescript
type PostCreationMode = 'manual' | 'auto';
const [creationMode, setCreationMode] = useState<PostCreationMode>('manual');
```

### 8.2 — Ajuste na lógica de steps

Substituir a lógica de `totalSteps` e navegação para considerar o modo:

```typescript
const totalSteps = creationMode === 'auto' ? 3 : 4;

// No handleNext do Step 1 em modo auto, pular direto para Step 2
const handleNext = () => {
  if (creationMode === 'auto' && currentStep === 1) {
    setCurrentStep(2);
    return;
  }
  // lógica existente para modo manual...
};
```

### 8.3 — Toggle UI (adicionar ACIMA do conteúdo do Step 1)

Inserir este componente antes do `{currentStep === 1 && (...)}` existente:

```tsx
{/* Mode Toggle — visible on step 1 only */}
{currentStep === 1 && (
  <div className="flex items-center gap-2 mb-6 p-1 bg-zinc-800/60 rounded-xl border border-zinc-700/50 w-fit">
    <button
      onClick={() => setCreationMode('manual')}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        creationMode === 'manual'
          ? 'bg-zinc-700 text-white shadow'
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <span>🔗</span>
      <span>Usar URL</span>
    </button>
    <button
      onClick={() => setCreationMode('auto')}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        creationMode === 'auto'
          ? 'bg-zinc-700 text-white shadow'
          : 'text-zinc-400 hover:text-zinc-200'
      }`}
    >
      <span>✨</span>
      <span>Automático</span>
    </button>
  </div>
)}
```

### 8.4 — Substituição do Step 1 em modo auto

Dentro do bloco `{currentStep === 1 && (...)}`, antes do formulário de URL existente, adicionar a condição:

```tsx
{currentStep === 1 && (
  creationMode === 'auto' ? (
    /* ── Modo Automático: card informativo ── */
    <div className="flex flex-col gap-6">
      <div className="p-6 rounded-2xl bg-zinc-800/40 border border-zinc-700/50 text-center">
        <div className="text-3xl mb-3">✨</div>
        <h3 className="text-lg font-semibold text-white mb-2">Modo Automático</h3>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xs mx-auto">
          O ShadowFeed vai buscar automaticamente o melhor conteúdo para o seu público
          {user?.user_metadata?.target_audience
            ? `: ${user.user_metadata.target_audience}`
            : '.'}
        </p>
        <p className="text-xs text-zinc-500 mt-3">
          Escolha o tema e o modelo para continuar
        </p>
      </div>
      <button
        onClick={() => setCurrentStep(2)}
        className="w-full py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-zinc-100 transition-colors"
      >
        Continuar →
      </button>
    </div>
  ) : (
    /* ── Modo Manual: formulário de URL existente (sem alterações) ── */
    <div>
      {/* ... conteúdo existente do Step 1 manual ... */}
    </div>
  )
)}
```

> **IMPORTANTE:** O conteúdo do modo manual (formulário de URL) deve ser mantido idêntico ao atual — apenas envolvido na condição `creationMode === 'manual'`.

### 8.5 — Indicador de steps adaptado

Encontrar a parte que exibe "Passo X de Y" ou o indicador de progresso e ajustar:

```typescript
// Se tiver um texto de progresso como "1 / 4"
const displayStep = creationMode === 'auto' && currentStep > 1 ? currentStep - 1 : currentStep;
const displayTotal = totalSteps;
// Usar displayStep / displayTotal na UI
```

### 8.6 — Endpoint no handleGenerate

Localizar a função `handleGenerate` e modificar a URL e o body:

```typescript
const isAutoMode = creationMode === 'auto';
const endpoint = isAutoMode
  ? `${process.env.NEXT_PUBLIC_API_URL}/forge-smart/generate`
  : `${process.env.NEXT_PUBLIC_API_URL}/forge-personalized/generate`;

const body = isAutoMode
  ? {
      userId: user.id,
      themeId: selectedTheme,
      productMode: isProductMode,
      productDescription: isProductMode ? productDescription : undefined,
      ctaText: isProductMode ? ctaText : undefined,
      modelConfigId: selectedModel,
    }
  : {
      // body existente do modo manual (sem alterações)
      url: url.trim(),
      themeId: selectedTheme,
      userId: user.id,
      productMode: isProductMode,
      productDescription: isProductMode ? productDescription : undefined,
      ctaText: isProductMode ? ctaText : undefined,
      modelConfigId: selectedModel,
    };
```

**Critério de aceite:**
- [ ] Toggle aparece corretamente no Step 1
- [ ] Em modo "Automático", Step 1 mostra card informativo (sem campo de URL)
- [ ] Clicar "Continuar" no card vai para Step 2 (tema)
- [ ] Em modo "Manual", tudo funciona exatamente como antes (sem regressão)
- [ ] Submit em modo "Automático" chama `/api/forge-smart/generate`
- [ ] Submit em modo "Manual" chama `/api/forge-personalized/generate` (sem alteração)
- [ ] Indicador de progresso mostra 3 steps em modo auto, 4 em modo manual

---

## Ordem de Deploy

```
Story 7 (DB migration)   ← executar primeiro no Supabase
     ↓
Story 1 (tipos)
     ↓
Story 2 (query generator)
Story 3 (scorer)          ← paralelo com story 2
     ↓
Story 4 (fetcher)
     ↓
Story 5 (service)
     ↓
Story 6 (controller + rota)
     ↓
Testar backend: POST /api/forge-smart/generate
     ↓
Story 8 (frontend toggle)
     ↓
Testar end-to-end no browser
```

---

## Checklist de Validação Final

```
[ ] POST /api/forge-smart/generate { userId, themeId } → 202 em < 300ms
[ ] Post criado em sf_posts com generation_method = 'smart'
[ ] Post tem smart_query_used preenchido com a query vencedora
[ ] Usuário sem setup_completed → erro 202 (processamento falha com log, não HTTP 400)
[ ] Usuário sem tokens → idem (falha no background com log)
[ ] Toggle frontend funciona nos dois sentidos
[ ] Modo manual: zero regressão, tudo igual a antes
[ ] Modo auto: step 1 é o card informativo, steps 2-4 são tema/modelo/produto
[ ] Posts gerados no modo auto têm a mesma qualidade visual
[ ] Mesma quantidade de tokens é debitada nos dois modos
[ ] Logs de todos os stages aparecem corretamente
```

---

*FORGE-SMART — Stories v1.0*
*Depende de: prd-forge-smart.md, pdrshadowfeed.md*
