import { logger } from '../../config/logger.js';
import type { SmartCandidate, SmartCandidateScored } from './forge-smart.types.js';
import type { PillarConfig } from '../../shared/types/pillar.types.js';

// ─── Recency score (0-10) ──────────────────────────────────────

function computeRecencyScore(posted_at: string | null): number {
  if (!posted_at) return 2;
  const diffMs = Date.now() - new Date(posted_at).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 6) return 10;
  if (diffHours < 24) return 8;
  if (diffHours < 48) return 6;
  if (diffHours < 168) return 4; // 7 dias
  return 2;
}

// ─── Engagement score (0-10) ───────────────────────────────────

function computeEngagementScore(source_score: number | null): number {
  if (!source_score) return 2;
  if (source_score > 5000) return 10;
  if (source_score > 1000) return 8;
  if (source_score > 500) return 6;
  if (source_score > 100) return 4;
  return 2;
}

// ─── Content richness score (0-10) ─────────────────────────────

function computeRichnessScore(candidate: SmartCandidate): number {
  let score = 0;
  if (candidate.summary && candidate.summary.length > 100) score += 5;
  if (candidate.url && candidate.url.startsWith('http')) score += 3;
  if (candidate.author) score += 2;
  return score;
}

// ─── Score final ───────────────────────────────────────────────

function computeFinalScore(candidate: SmartCandidate, pillarConfig: PillarConfig): number {
  const recencyVal    = computeRecencyScore(candidate.posted_at);
  const engagementVal = computeEngagementScore(candidate.source_score);
  const relevanceVal  = candidate.relevance_score; // já 0-10
  const richnessVal   = computeRichnessScore(candidate);

  const { recency, engagement, relevance, richness } = pillarConfig.scoringWeights;
  const baseScore = (recencyVal * recency) + (engagementVal * engagement)
                  + (relevanceVal * relevance) + (richnessVal * richness);

  const sourceMultiplier = pillarConfig.sourceWeights[candidate.source_type] ?? 1.0;
  return baseScore * sourceMultiplier;
}

// ─── Export principal ──────────────────────────────────────────

export function selectBestCandidate(
  candidates: SmartCandidate[],
  pillarConfig: PillarConfig
): SmartCandidateScored {
  if (candidates.length === 0) {
    throw new Error('[FORGE-SMART] No candidates available for scoring');
  }

  const scored: SmartCandidateScored[] = candidates.map((c) => ({
    ...c,
    final_score: computeFinalScore(c, pillarConfig),
  }));

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

export function scoreAllCandidates(
  candidates: SmartCandidate[],
  pillarConfig: PillarConfig
): SmartCandidateScored[] {
  if (candidates.length === 0) return [];

  const scored: SmartCandidateScored[] = candidates.map((c) => ({
    ...c,
    final_score: computeFinalScore(c, pillarConfig),
  }));

  scored.sort((a, b) => b.final_score - a.final_score);
  return scored;
}
