// src/modules/forge-shadowfeed/discovery/shadowfeed-discovery.service.ts

import { supabase } from '../../../config/supabase.js';
import { logger } from '../../../config/logger.js';
import { generateShadowFeedQueries } from '../shadowfeed-query-generator.js';
import { fetchShadowFeedCandidates } from '../shadowfeed-content-fetcher.js';
import { scoreShadowFeedCandidates, toDiscoverySource } from '../shadowfeed-content-scorer.js';
import { scrapeWinnerBody } from './shadowfeed-winner-scraper.js';
import { summarizeContent } from './shadowfeed-content-summarizer.js';
import type { PillarId, DiscoverySource, ResearchDigest } from '../forge-shadowfeed.types.js';

// ── Result types ─────────────────────────────────────────────────────────────

export interface DiscoverySuccess {
  success: true;
  digest: ResearchDigest;
  discoverySource: DiscoverySource;
}

export interface DiscoveryFailure {
  success: false;
  reason: string;
  /** Partial discovery source if scoring succeeded but scrape/summarize failed */
  discoverySource?: DiscoverySource;
}

export type DiscoveryResult = DiscoverySuccess | DiscoveryFailure;

// ── 6-Stage Pipeline ─────────────────────────────────────────────────────────

/**
 * Execute the 6-stage discovery pipeline:
 *   Stage 1: QUERY GEN → pillar-specific queries (existing)
 *   Stage 2: MULTI-FETCH → Google News BR + Reddit BR + Twitter BR (existing)
 *   Stage 3: SCORE → pillar-weighted scoring → select winner (existing)
 *   Stage 4: SCRAPE → winner body extraction (NEW)
 *   Stage 5: SUMMARIZE → LLM extracts ResearchDigest (NEW)
 *   Stage 6: RETURN → DiscoveryResult
 *
 * Failure at any stage returns DiscoveryFailure — NEVER throws.
 */
export async function runDiscoveryPipeline(
  pillarId: PillarId,
): Promise<DiscoveryResult> {
  const startTime = Date.now();

  try {
    // ── Stage 1: Query Generation ──────────────────────────────────────────

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentPosts = await supabase
      .from('sf_posts')
      .select('theme')
      .eq('generation_method', 'shadowfeed')
      .order('created_at', { ascending: false })
      .limit(30);

    const lastPostsHistory = (recentPosts.data ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: any) => p.theme as string)
      .filter(Boolean);

    const today = new Date().toISOString().slice(0, 10);
    const queries = await generateShadowFeedQueries({
      pillarId,
      date: today,
      lastPostsHistory,
    });

    logger.info(
      { pillarId, queryCount: queries.length },
      '[SHADOWFEED:DISCOVERY] Stage 1 — Queries generated',
    );

    // ── Stage 2: Multi-Fetch ───────────────────────────────────────────────

    const candidates = await fetchShadowFeedCandidates(queries, pillarId);

    logger.info(
      { pillarId, candidateCount: candidates.length },
      '[SHADOWFEED:DISCOVERY] Stage 2 — Candidates fetched',
    );

    if (candidates.length === 0) {
      return { success: false, reason: 'No candidates found from any source' };
    }

    // ── Stage 3: Score & Select Winner ─────────────────────────────────────

    const winner = scoreShadowFeedCandidates(candidates);

    if (!winner) {
      return { success: false, reason: 'Scoring returned no winner' };
    }

    const discoverySource = toDiscoverySource(winner);

    logger.info(
      { pillarId, winner: winner.title, score: winner.final_score },
      '[SHADOWFEED:DISCOVERY] Stage 3 — Winner selected',
    );

    // ── Stage 4: Scrape Winner Body ────────────────────────────────────────

    const scrapeResult = await scrapeWinnerBody(winner);

    if (!scrapeResult) {
      logger.info(
        { pillarId, winner: winner.title },
        '[SHADOWFEED:DISCOVERY] Stage 4 — Scrape failed, returning discovery-only (no digest)',
      );
      return {
        success: false,
        reason: 'Scrape failed — no body content available',
        discoverySource,
      };
    }

    logger.info(
      { pillarId, charCount: scrapeResult.charCount, source: scrapeResult.source },
      '[SHADOWFEED:DISCOVERY] Stage 4 — Body scraped',
    );

    // ── Stage 5: Summarize → ResearchDigest ────────────────────────────────

    const digest = await summarizeContent(scrapeResult.scrapedBody, pillarId);

    if (!digest) {
      logger.info(
        { pillarId, winner: winner.title },
        '[SHADOWFEED:DISCOVERY] Stage 5 — Summarization failed, returning discovery-only',
      );
      return {
        success: false,
        reason: 'Summarization failed — could not extract ResearchDigest',
        discoverySource,
      };
    }

    const elapsedMs = Date.now() - startTime;
    logger.info(
      {
        pillarId,
        winner: winner.title,
        contentDepth: digest.contentDepth,
        dataPointCount: digest.dataPoints.length,
        elapsedMs,
      },
      '[SHADOWFEED:DISCOVERY] Stage 6 — Pipeline complete (SUCCESS)',
    );

    // ── Stage 6: Return ────────────────────────────────────────────────────

    return {
      success: true,
      digest,
      discoverySource,
    };
  } catch (err) {
    logger.error(
      { pillarId, error: (err as Error).message },
      '[SHADOWFEED:DISCOVERY] Pipeline failed unexpectedly',
    );
    return {
      success: false,
      reason: `Unexpected error: ${(err as Error).message}`,
    };
  }
}
