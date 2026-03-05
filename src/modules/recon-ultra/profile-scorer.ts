import type { PillarConfig, PillarId, SourceType } from '../../shared/types/pillar.types.js';
import { classifyPillarAlignment, getPillarTag, heuristicPillarScores } from './pillar-tagger.js';
import type { ReconUltraCandidate } from './recon-ultra.types.js';

// ─── Stopwords (English + Portuguese) ─────────────────────────

const STOPWORDS = new Set([
  // English
  'the', 'a', 'an', 'and', 'or', 'for', 'to', 'of', 'in', 'with', 'how', 'that', 'this', 'they', 'their', 'from', 'have', 'been', 'will', 'would', 'could', 'should', 'about', 'more', 'than', 'into', 'also', 'just', 'very', 'when', 'what', 'which', 'your', 'them',
  // Portuguese
  'que', 'para', 'com', 'por', 'uma', 'como', 'mais', 'dos', 'das', 'nos', 'nas', 'seu', 'sua', 'seus', 'suas', 'este', 'esta', 'esse', 'essa', 'isso', 'aqui', 'ali', 'onde', 'quando', 'muito', 'também', 'entre', 'sobre', 'ainda', 'mesmo',
]);

// ─── Task 1: Extract Profile Keywords ─────────────────────────

export function extractProfileKeywords(
  niche: string | null,
  target_audience: string,
  audience_frustration: string | null,
  expertise_statement: string | null,
  user_prompt: string | null
): string[] {
  const combined = [niche, target_audience, audience_frustration, expertise_statement, user_prompt]
    .filter(Boolean).join(' ');

  const words = combined.toLowerCase().split(/\W+/)
    .filter(w => w.length >= 4 && !STOPWORDS.has(w));
  return [...new Set(words)].slice(0, 15);
}

// ─── Task 2: TF-IDF Relevance Scoring ─────────────────────────

function computeRelevanceScore(
  title: string,
  summary: string | null,
  bodyContent: string | null,
  keywords: string[]
): number {
  if (keywords.length === 0) return 5.0;

  const text = [title, summary, bodyContent].filter(Boolean).join(' ').toLowerCase();
  let matchCount = 0;
  for (const kw of keywords) {
    if (text.includes(kw)) matchCount++;
  }

  let score = (matchCount / keywords.length) * 10;

  // Stat signals: +0.5
  if (/\d+%|\d+x|\$\d+|\d+k\b|\d+ percent/i.test(title)) score += 0.5;
  // Credibility signals: +0.5
  if (/study|report|survey|research|data|found|according/i.test(title)) score += 0.5;
  // How-to signal: +0.3
  if (/how to|tips|guide|step|strategy|method/i.test(title)) score += 0.3;
  // PR fluff penalty: -2
  if (/announces|pleased to|proud to|excited to|partnership/i.test(title)) score -= 2;

  return Math.max(0, Math.min(score, 10));
}

// ─── Task 3: Scoring Dimensions ───────────────────────────────

function computeRecencyScore(posted_at: string | null): number {
  if (!posted_at) return 2;
  const diffMs = Date.now() - new Date(posted_at).getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  if (diffHours < 6) return 10;
  if (diffHours < 24) return 8;
  if (diffHours < 48) return 6;
  if (diffHours < 168) return 4; // 7 days
  return 2;
}

function computeEngagementScore(source_score: number | null): number {
  if (!source_score) return 2;
  if (source_score > 5000) return 10;
  if (source_score > 1000) return 8;
  if (source_score > 500) return 6;
  if (source_score > 100) return 4;
  return 2;
}

function computeRichnessScore(candidate: ReconUltraCandidate): number {
  let score = 0;
  if (candidate.body_content && candidate.body_content.length > 200) score += 5;
  if (candidate.url && candidate.url.startsWith('http')) score += 3;
  if (candidate.author) score += 2;
  if (candidate.body_content) score += 3; // body_content bonus (NEW for recon-ultra)
  return Math.min(score, 10);
}

const PILLAR_ALIGNMENT_WEIGHT = 0.15;

function computeFinalScoreWithAlignment(
  candidate: ReconUltraCandidate,
  profileKeywords: string[],
  pillarConfig: PillarConfig,
  pillarAlignmentScore: number
): number {
  const recencyVal = computeRecencyScore(candidate.posted_at);
  const engagementVal = computeEngagementScore(candidate.source_score);
  const relevanceVal = computeRelevanceScore(candidate.title, candidate.summary, candidate.body_content, profileKeywords);
  const richnessVal = computeRichnessScore(candidate);

  const { recency, engagement, relevance, richness } = pillarConfig.scoringWeights;
  const baseScore = (recencyVal * recency) + (engagementVal * engagement)
                  + (relevanceVal * relevance) + (richnessVal * richness)
                  + (pillarAlignmentScore * PILLAR_ALIGNMENT_WEIGHT);

  const sourceMultiplier = pillarConfig.sourceWeights[candidate.source_type as SourceType] ?? 1.0;
  return baseScore * sourceMultiplier;
}

// ─── Score single candidate (sync, with pre-computed alignment) ────

export function scoreReconCandidate(
  candidate: ReconUltraCandidate,
  profileKeywords: string[],
  pillarConfig: PillarConfig,
  pillarAlignmentScore?: number,
  pillarTag?: PillarId
): ReconUltraCandidate {
  const recency_score = computeRecencyScore(candidate.posted_at);
  const engagement_score = computeEngagementScore(candidate.source_score);
  const relevance_score = computeRelevanceScore(candidate.title, candidate.summary, candidate.body_content, profileKeywords);
  const richness_score = computeRichnessScore(candidate);
  const pillar_alignment_score = pillarAlignmentScore ?? candidate.pillar_alignment_score ?? 0;

  const { recency, engagement, relevance, richness } = pillarConfig.scoringWeights;
  const baseScore = (recency_score * recency) + (engagement_score * engagement)
                  + (relevance_score * relevance) + (richness_score * richness)
                  + (pillar_alignment_score * PILLAR_ALIGNMENT_WEIGHT);

  const sourceMultiplier = pillarConfig.sourceWeights[candidate.source_type as SourceType] ?? 1.0;
  const final_score = baseScore * sourceMultiplier;

  return {
    ...candidate,
    recency_score,
    engagement_score,
    relevance_score,
    richness_score,
    pillar_alignment_score,
    pillar_tag: pillarTag ?? candidate.pillar_tag,
    final_score,
  };
}

// ─── Score all candidates (with pillar alignment) ───────────

export async function scoreAllReconCandidates(
  candidates: ReconUltraCandidate[],
  profileKeywords: string[],
  pillarConfig: PillarConfig,
  userId: string,
  targetPillar: PillarId
): Promise<ReconUltraCandidate[]> {
  if (candidates.length === 0) return [];

  const scored = await Promise.all(
    candidates.map(async (c) => {
      let scores;
      try {
        scores = await classifyPillarAlignment(c.title, c.summary, userId, c.url ?? c.title);
      } catch {
        scores = heuristicPillarScores(c.title, c.summary);
      }
      const pillarAlignmentScore = scores[targetPillar];
      const pillarTag = getPillarTag(scores);
      return scoreReconCandidate(c, profileKeywords, pillarConfig, pillarAlignmentScore, pillarTag);
    })
  );

  scored.sort((a, b) => b.final_score - a.final_score);
  return scored;
}

// ─── Score all candidates (sync, no Gemini) ─────────────────

export function scoreAllReconCandidatesSync(
  candidates: ReconUltraCandidate[],
  profileKeywords: string[],
  pillarConfig: PillarConfig
): ReconUltraCandidate[] {
  if (candidates.length === 0) return [];

  const scored = candidates.map(c => scoreReconCandidate(c, profileKeywords, pillarConfig));
  scored.sort((a, b) => b.final_score - a.final_score);
  return scored;
}
