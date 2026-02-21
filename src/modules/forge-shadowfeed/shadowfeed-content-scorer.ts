import { logger } from '../../config/logger.js';
import type { SmartCandidate, SmartCandidateScored } from '../forge-smart/forge-smart.types.js';
import type { DiscoverySource } from './forge-shadowfeed.types.js';

// ─── Brand keywords (AC10) ────────────────────────────────────────

const SHADOWFEED_KEYWORDS = [
  'instagram',
  'conteúdo',
  'carrossel',
  'marketing',
  'digital',
  'engajamento',
  'algoritmo',
  'criador',
  'IA',
  'inteligência artificial',
  'viralizar',
  'crescer',
  'seguidores',
  'stories',
  'reels',
];

// ─── Trend velocity score (50%) ───────────────────────────────────
// Higher score for more recent content — "be FIRST on trending"

function computeTrendVelocity(posted_at: string | null): number {
  if (!posted_at) return 2;
  const diffMs = Date.now() - new Date(posted_at).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 3) return 10;
  if (diffHours < 6) return 9;
  if (diffHours < 24) return 7;
  if (diffHours < 48) return 5;
  if (diffHours < 168) return 3; // 7 days
  return 1;
}

// ─── Domain relevance score (30%) ─────────────────────────────────
// AC10: SHADOWFEED_KEYWORDS +1.5/hit, Instagram +1.0, numeric +0.5, PR fluff -2.0, trending velocity +2.0

function computeRelevanceScore(title: string, summary: string | null): number {
  const text = `${title} ${summary ?? ''}`.toLowerCase();
  let score = 4.0; // base

  // Keyword match: +1.5 per hit (max 3 hits)
  let hits = 0;
  for (const kw of SHADOWFEED_KEYWORDS) {
    if (text.includes(kw.toLowerCase())) {
      score += 1.5;
      hits++;
      if (hits >= 3) break;
    }
  }

  // Instagram mention: +1.0
  if (text.includes('instagram')) score += 1.0;

  // Numeric data: +0.5
  if (/\d+%|\d+x|\d+\s*reais|\d+k\b|\d+ mil/i.test(title)) score += 0.5;

  // PR fluff penalty: -2.0
  if (
    /anuncia|orgulho|parceria|empolgados|press release|comunicado|lança novo/i.test(title)
  )
    score -= 2.0;

  // Trending velocity signal in title: +2.0
  if (/viral|tendência|trend|bomba|explodiu|disparou|alta de/i.test(title)) score += 2.0;

  return Math.max(0, Math.min(score, 10));
}

// ─── Engagement score (15%) ───────────────────────────────────────

function computeEngagementScore(source_score: number | null): number {
  if (!source_score) return 2;
  if (source_score > 5000) return 10;
  if (source_score > 1000) return 8;
  if (source_score > 500) return 6;
  if (source_score > 100) return 4;
  return 2;
}

// ─── Richness score (5%) ──────────────────────────────────────────

function computeRichnessScore(candidate: SmartCandidate): number {
  let score = 0;
  if (candidate.summary && candidate.summary.length > 100) score += 5;
  if (candidate.url && candidate.url.startsWith('http')) score += 3;
  if (candidate.author) score += 2;
  return score;
}

// ─── Brand-weighted final score (AC9) ─────────────────────────────
// Weights: trend 50%, relevance 30%, engagement 15%, richness 5%

function computeFinalScore(candidate: SmartCandidate): number {
  const trend = computeTrendVelocity(candidate.posted_at);
  const relevance = computeRelevanceScore(candidate.title, candidate.summary);
  const engagement = computeEngagementScore(candidate.source_score);
  const richness = computeRichnessScore(candidate);

  return (
    trend * 0.5 +
    relevance * 0.3 +
    engagement * 0.15 +
    richness * 0.05
  );
}

// ─── Main export ──────────────────────────────────────────────────

/**
 * Score all candidates with ShadowFeed brand weights and return the winner.
 * Returns null if no candidates — caller must fallback to hardcoded templates (AC13).
 */
export function scoreShadowFeedCandidates(
  candidates: SmartCandidate[]
): SmartCandidateScored | null {
  // AC13: fallback — return null, never throw
  if (candidates.length === 0) {
    return null;
  }

  const scored: SmartCandidateScored[] = candidates.map((c) => ({
    ...c,
    final_score: computeFinalScore(c),
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
    '[SHADOWFEED:SCORE] Winner selected'
  );

  return winner;
}

/**
 * Map a scored candidate to DiscoverySource for queue storage.
 */
export function toDiscoverySource(candidate: SmartCandidateScored): DiscoverySource {
  return {
    title: candidate.title,
    url: candidate.url ?? '',
    source: candidate.source_type,
    score: parseFloat(candidate.final_score.toFixed(2)),
    trending: candidate.posted_at
      ? Date.now() - new Date(candidate.posted_at).getTime() < 24 * 60 * 60 * 1000
      : false,
  };
}
