import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { generateSmartQueries } from './smart-query-generator.js';
import { fetchSmartCandidates, extractProfileKeywords } from './smart-content-fetcher.js';
import { selectBestCandidate, scoreAllCandidates } from './smart-content-scorer.js';
import { enrichWinnerWithScrapedBody } from './smart-winner-scraper.js';
import { forgePersonalizedCarousel } from '../forge-personalized/forge-personalized.service.js';
import { hasEnoughTokens } from '../credits/credits.service.js';
import { getPillarConfig } from '../pillar-system/pillar.service.js';
import type { ForgeSmartRequest, SmartCandidate, SmartCandidateScored, DiscoverRequest, DiscoverResponse } from './forge-smart.types.js';
import type { GeneratedPost } from '../../shared/types/global.types.js';

async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error('[FORGE-SMART] User profile not found');
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data as any;
}

// ── Cache helpers ────────────────────────────────────────────

function mapIntelToSmartCandidates(intelItems: Record<string, unknown>[]): SmartCandidate[] {
  return intelItems.map(item => ({
    source_type: item.source_type as SmartCandidate['source_type'],
    title: item.title as string,
    summary: (item.summary as string) ?? (item.body_content as string)?.slice(0, 500) ?? null,
    url: (item.url as string) ?? null,
    author: (item.author as string) ?? null,
    source_score: item.source_score ? Number(item.source_score) : null,
    source_comments: item.source_comments ? Number(item.source_comments) : null,
    posted_at: (item.posted_at as string) ?? null,
    relevance_score: Number(item.relevance_score),
    query_used: (item.query_used as string) ?? 'recon-cache',
    scraped_body: (item.body_content as string) ?? null,
  }));
}

function computeTtl(sourceType: string): string {
  const hours = sourceType === 'twitter' ? 24 : sourceType === 'reddit' ? 72 : 168;
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

async function writeBackToReconCache(
  userId: string,
  pillarId: string,
  candidates: SmartCandidateScored[]
): Promise<void> {
  const items = candidates.slice(0, 20).map(c => ({
    user_id: userId,
    source_type: c.source_type,
    pillar_tag: pillarId,
    title: c.title,
    summary: c.summary,
    body_content: c.scraped_body ?? null,
    url: c.url,
    author: c.author,
    relevance_score: c.relevance_score,
    final_score: c.final_score,
    query_used: c.query_used,
    posted_at: c.posted_at,
    expires_at: computeTtl(c.source_type),
  }));

  const { error } = await supabase
    .from('sf_intel_sources_v2')
    .upsert(items, { onConflict: 'user_id,url', ignoreDuplicates: false });

  if (error) {
    logger.warn({ error: error.message }, '[FORGE-SMART] Write-back to recon cache failed');
  } else {
    logger.info({ count: items.length }, '[FORGE-SMART] Write-back to recon cache completed');
  }
}

export async function forgeSmartCarousel(
  request: ForgeSmartRequest
): Promise<GeneratedPost> {
  const { userId, themeId, pillarId, productMode, offer } = request;
  const startTime = Date.now();
  const pillarConfig = getPillarConfig(pillarId);

  logger.info({ userId, themeId, pillarId: pillarConfig.id }, '[FORGE-SMART] Starting smart generation');

  // ── Validações ───────────────────────────────────────────────

  const userProfile = await getUserProfile(userId);

  if (!userProfile.setup_completed) {
    throw new Error('[FORGE-SMART] User must complete setup before using smart generation');
  }

  // Support both v1 (target_audience/main_pain_point) and v2 (niche/audience_frustration) profiles
  const hasV1Setup = !!(userProfile.target_audience && userProfile.main_pain_point);
  const hasV2Setup = !!(userProfile.niche && (userProfile.audience_frustration || userProfile.audience_desire));

  if (!hasV1Setup && !hasV2Setup) {
    throw new Error('[FORGE-SMART] User profile incomplete: complete setup before using smart generation');
  }

  // Prefer v2 profile fields when available (v1 fields may be stale)
  const targetAudience: string = hasV2Setup
    ? `${userProfile.niche} audience` + (userProfile.audience_desire ? ` — ${userProfile.audience_desire.slice(0, 120)}` : '')
    : userProfile.target_audience || '';

  const mainPainPoint: string = hasV2Setup
    ? userProfile.audience_frustration?.slice(0, 120) || userProfile.audience_desire?.slice(0, 120) || ''
    : userProfile.main_pain_point || '';

  const tokenCheck = await hasEnoughTokens(userId, themeId, !!productMode);
  if (!tokenCheck.enough) {
    throw new Error(
      `[FORGE-SMART] Insufficient tokens: has ${tokenCheck.planRemaining + (tokenCheck.freeTokens ?? 0) + tokenCheck.extraTokens}, needs ${tokenCheck.required}`
    );
  }

  // ── Stage 0: Cache Lookup ──────────────────────────────────────

  logger.info({ userId, pillarId: pillarConfig.id }, '[FORGE-SMART] Stage 0 — checking recon cache');

  let cachedCandidates: SmartCandidate[] | null = null;
  let generationSource: 'cache' | 'live' = 'live';
  let cachedUrlToIntelId = new Map<string, string>();

  try {
    const { data: cached } = await supabase
      .from('sf_intel_sources_v2')
      .select('*')
      .eq('user_id', userId)
      .eq('pillar_tag', pillarConfig.id)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('final_score', { ascending: false })
      .limit(10);

    if (cached && cached.length >= 3 && (cached[0] as Record<string, unknown>).final_score !== null && Number((cached[0] as Record<string, unknown>).final_score) >= 7.0) {
      const cachedRows = cached as Record<string, unknown>[];
      cachedCandidates = mapIntelToSmartCandidates(cachedRows);
      generationSource = 'cache';
      for (const row of cachedRows) {
        if (row.url && row.id) cachedUrlToIntelId.set(row.url as string, row.id as string);
      }
      logger.info(
        { userId, count: cached.length, topScore: Number(cachedRows[0].final_score) },
        '[FORGE-SMART] Stage 0 — CACHE HIT'
      );
    }
  } catch (err) {
    logger.warn({ error: (err as Error).message }, '[FORGE-SMART] Stage 0 — cache lookup failed, falling back to live');
  }

  let enrichedWinner: SmartCandidateScored;

  if (cachedCandidates) {
    // ── Cache HIT: skip Stages 1-2, go straight to scoring ──────

    logger.info({ userId, candidateCount: cachedCandidates.length }, '[FORGE-SMART] Stage 3 (cached) — selecting best candidate');
    const winner = selectBestCandidate(cachedCandidates, pillarConfig);

    logger.info({ userId, winner: winner.title }, '[FORGE-SMART] Stage 2.5 — enriching winner');
    enrichedWinner = await enrichWinnerWithScrapedBody(winner);
    logger.info(
      { userId, source: enrichedWinner.source_type, url: enrichedWinner.url, bodyLength: enrichedWinner.scraped_body?.length ?? 0 },
      '[FORGE-SMART:SCRAPE] Winner enriched (from cache)'
    );
  } else {
    // ── Cache MISS: full live pipeline ───────────────────────────

    // ── Stage 1: Query Generation ────────────────────────────────

    logger.info({ userId }, '[FORGE-SMART] Stage 1 — generating queries');

    const queries = await generateSmartQueries({
      target_audience: targetAudience,
      main_pain_point: mainPainPoint,
      voice_tone: userProfile.voice_tone ?? 'professional',
      user_prompt: userProfile.user_prompt,
      niche: userProfile.niche,
      pillarConfig,
    });

    // ── Stage 2: Content Fetch ────────────────────────────────────

    logger.info({ userId, queryCount: queries.length }, '[FORGE-SMART] Stage 2 — fetching candidates');

    const profileKeywords = extractProfileKeywords(
      targetAudience,
      mainPainPoint,
      [userProfile.niche, userProfile.user_prompt].filter(Boolean).join(' ') || null
    );

    const candidates = await fetchSmartCandidates(queries, userId, profileKeywords);

    if (candidates.length === 0) {
      throw new Error('[FORGE-SMART] No suitable content found for your audience. Try again in a few minutes.');
    }

    // ── Stage 3: Content Scoring ──────────────────────────────────

    logger.info({ userId, candidateCount: candidates.length }, '[FORGE-SMART] Stage 3 — selecting best candidate');

    const scored = scoreAllCandidates(candidates, pillarConfig);
    const winner = scored[0];

    // ── Write-back to recon cache ─────────────────────────────────

    try {
      await writeBackToReconCache(userId, pillarConfig.id, scored);
    } catch (err) {
      logger.warn({ error: (err as Error).message }, '[FORGE-SMART] Write-back failed, continuing');
    }

    // ── Stage 2.5: URL Scraping ───────────────────────────────────

    logger.info({ userId, winner: winner.title }, '[FORGE-SMART] Stage 2.5 — enriching winner');
    enrichedWinner = await enrichWinnerWithScrapedBody(winner);
    logger.info(
      { userId, source: enrichedWinner.source_type, url: enrichedWinner.url, bodyLength: enrichedWinner.scraped_body?.length ?? 0 },
      '[FORGE-SMART:SCRAPE] Winner enriched'
    );
  }

  // ── Stage 4: Forge Personalized ───────────────────────────────

  logger.info(
    { userId, winner: enrichedWinner.title, score: enrichedWinner.final_score },
    '[FORGE-SMART] Stage 4 — delegating to forge-personalized'
  );

  const post = await forgePersonalizedCarousel({
    title: enrichedWinner.title,
    summary: enrichedWinner.scraped_body ?? enrichedWinner.summary ?? undefined,
    rawContent: enrichedWinner.scraped_body ?? enrichedWinner.summary ?? enrichedWinner.title,
    category: undefined,
    themeId,
    userId,
    productMode,
    offer,
  });

  // ── Atualizar metadados smart ─────────────────────────────────

  await supabase
    .from('sf_posts')
    .update({
      generation_method: 'smart',
      smart_query_used: enrichedWinner.query_used,
      generation_source: generationSource,
    })
    .eq('id', post.id);

  // ── Mark used intel (cache hit only) ────────────────────────

  if (generationSource === 'cache' && enrichedWinner.url) {
    const winnerIntelId = cachedUrlToIntelId.get(enrichedWinner.url);
    if (winnerIntelId) {
      try {
        await supabase
          .from('sf_intel_sources_v2')
          .update({ used: true, used_in_post_id: post.id, used_at: new Date().toISOString() })
          .eq('id', winnerIntelId);
      } catch (err) {
        logger.warn({ error: (err as Error).message }, '[FORGE-SMART] Failed to mark intel as used');
      }
    }
  }

  const totalMs = Date.now() - startTime;

  logger.info(
    {
      postId: post.id,
      userId,
      themeId,
      winner: enrichedWinner.title,
      winnerScore: enrichedWinner.final_score,
      generationSource,
      totalMs,
    },
    '[FORGE-SMART] Smart generation completed'
  );

  return post;
}

export async function discoverCandidates(
  request: DiscoverRequest
): Promise<DiscoverResponse> {
  const { userId, pillarId } = request;
  const pillarConfig = getPillarConfig(pillarId);

  logger.info({ userId, pillarId }, '[FORGE-SMART:DISCOVER] Starting discovery');

  const userProfile = await getUserProfile(userId);

  if (!userProfile.setup_completed) {
    throw new Error('[FORGE-SMART:DISCOVER] User must complete setup first');
  }

  const hasV1Setup = !!(userProfile.target_audience && userProfile.main_pain_point);
  const hasV2Setup = !!(userProfile.niche && (userProfile.audience_frustration || userProfile.audience_desire));

  if (!hasV1Setup && !hasV2Setup) {
    throw new Error('[FORGE-SMART:DISCOVER] User profile incomplete');
  }

  const targetAudience: string = hasV2Setup
    ? `${userProfile.niche} audience` + (userProfile.audience_desire ? ` — ${userProfile.audience_desire.slice(0, 120)}` : '')
    : userProfile.target_audience || '';

  const mainPainPoint: string = hasV2Setup
    ? userProfile.audience_frustration?.slice(0, 120) || userProfile.audience_desire?.slice(0, 120) || ''
    : userProfile.main_pain_point || '';

  // Stage 1: Generate queries
  const queries = await generateSmartQueries({
    target_audience: targetAudience,
    main_pain_point: mainPainPoint,
    voice_tone: userProfile.voice_tone ?? 'professional',
    user_prompt: userProfile.user_prompt,
    niche: userProfile.niche,
    pillarConfig,
  });

  // Stage 2: Fetch candidates
  const profileKeywords = extractProfileKeywords(
    targetAudience,
    mainPainPoint,
    [userProfile.niche, userProfile.user_prompt].filter(Boolean).join(' ') || null
  );

  const rawCandidates = await fetchSmartCandidates(queries, userId, profileKeywords);

  if (rawCandidates.length === 0) {
    logger.warn({ userId, pillarId }, '[FORGE-SMART:DISCOVER] No candidates found after filtering');
    return {
      candidates: [],
      queriesUsed: queries,
      pillarId,
      message: 'No suitable content found for your audience. Try a different pillar or check back later.',
    };
  }

  // Stage 3: Score and return top 3
  const scored = scoreAllCandidates(rawCandidates, pillarConfig);
  const top3 = scored.slice(0, 3);

  logger.info(
    { userId, pillarId, totalCandidates: rawCandidates.length, returned: top3.length },
    '[FORGE-SMART:DISCOVER] Discovery complete'
  );

  return {
    candidates: top3.map((c) => ({
      title: c.title,
      summary: c.summary,
      url: c.url,
      source_type: c.source_type,
      final_score: c.final_score,
      posted_at: c.posted_at,
    })),
    queriesUsed: queries,
    pillarId,
  };
}
