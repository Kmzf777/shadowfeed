import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { generateSmartQueries } from './smart-query-generator.js';
import { fetchSmartCandidates, extractProfileKeywords } from './smart-content-fetcher.js';
import { selectBestCandidate } from './smart-content-scorer.js';
import { enrichWinnerWithScrapedBody } from './smart-winner-scraper.js';
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

  // ── Validações ───────────────────────────────────────────────

  const userProfile = await getUserProfile(userId);

  if (!userProfile.setup_completed) {
    throw new Error('[FORGE-SMART] User must complete setup before using smart generation');
  }

  if (!userProfile.target_audience || !userProfile.main_pain_point) {
    throw new Error('[FORGE-SMART] User profile incomplete: target_audience and main_pain_point are required');
  }

  const tokenCheck = await hasEnoughTokens(userId, themeId, !!productMode);
  if (!tokenCheck.enough) {
    throw new Error(
      `[FORGE-SMART] Insufficient tokens: has ${tokenCheck.planRemaining + (tokenCheck.freeTokens ?? 0) + tokenCheck.extraTokens}, needs ${tokenCheck.required}`
    );
  }

  // ── Stage 1: Query Generation ────────────────────────────────

  logger.info({ userId }, '[FORGE-SMART] Stage 1 — generating queries');

  const queries = await generateSmartQueries({
    target_audience: userProfile.target_audience,
    main_pain_point: userProfile.main_pain_point,
    voice_tone: userProfile.voice_tone ?? 'professional',
    user_prompt: userProfile.user_prompt,
  });

  // ── Stage 2: Content Fetch ────────────────────────────────────

  logger.info({ userId, queryCount: queries.length }, '[FORGE-SMART] Stage 2 — fetching candidates');

  const profileKeywords = extractProfileKeywords(
    userProfile.target_audience,
    userProfile.main_pain_point,
    userProfile.user_prompt
  );

  const candidates = await fetchSmartCandidates(queries, userId, profileKeywords);

  if (candidates.length === 0) {
    throw new Error('[FORGE-SMART] No suitable content found for your audience. Try again in a few minutes.');
  }

  // ── Stage 3: Content Scoring ──────────────────────────────────

  logger.info({ userId, candidateCount: candidates.length }, '[FORGE-SMART] Stage 3 — selecting best candidate');

  const winner = selectBestCandidate(candidates);

  // ── Stage 2.5: URL Scraping ───────────────────────────────────

  logger.info({ userId, winner: winner.title }, '[FORGE-SMART] Stage 2.5 — enriching winner');
  const enrichedWinner = await enrichWinnerWithScrapedBody(winner);
  logger.info(
    { userId, source: enrichedWinner.source_type, url: enrichedWinner.url, bodyLength: enrichedWinner.scraped_body?.length ?? 0 },
    '[FORGE-SMART:SCRAPE] Winner enriched'
  );

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
    productDescription,
    ctaText,
  });

  // ── Atualizar metadados smart ─────────────────────────────────

  await supabase
    .from('sf_posts')
    .update({
      generation_method: 'smart',
      smart_query_used: enrichedWinner.query_used,
    })
    .eq('id', post.id);

  const totalMs = Date.now() - startTime;

  logger.info(
    {
      postId: post.id,
      userId,
      themeId,
      winner: enrichedWinner.title,
      winnerScore: enrichedWinner.final_score,
      totalMs,
    },
    '[FORGE-SMART] Smart generation completed'
  );

  return post;
}
