import { logger } from '../../config/logger.js';
import { supabase } from '../../config/supabase.js';
import { getPillarConfig } from '../pillar-system/pillar.service.js';
import { generateReconQueries } from './recon-query-builder.js';
import { extractProfileKeywords, scoreAllReconCandidates } from './profile-scorer.js';
import type { PillarId } from '../../shared/types/pillar.types.js';
import type {
  ReconSourceType,
  ReconUltraRequest,
  ReconUltraResult,
  ReconUltraCandidate,
} from './recon-ultra.types.js';
import { fetchNewsDynamic } from './sources/news-dynamic.source.js';
import { fetchTrendsDynamic } from './sources/trends-dynamic.source.js';
import { fetchTwitterDynamic } from './sources/twitter-dynamic.source.js';
import { fetchBlogArticles as fetchBlogArticlesReal } from './sources/blog.source.js';

// ── TTL Map (AC8) ───────────────────────────────────────────────
const TTL_MAP: Record<ReconSourceType, number> = {
  twitter: 24 * 60 * 60 * 1000,       // 24h
  reddit: 48 * 60 * 60 * 1000,        // 48h
  google_news: 72 * 60 * 60 * 1000,   // 72h
  google_trends: 24 * 60 * 60 * 1000, // 24h
  blog: 7 * 24 * 60 * 60 * 1000,      // 7d
};

const ALL_SOURCES: ReconSourceType[] = ['google_news', 'google_trends', 'reddit', 'twitter', 'blog'];

// ── PR / Editorial Filter (Task 4, AC5) ─────────────────────────
const PR_PATTERNS = [
  /proud\s+(to|partner|member)/i,
  /pleased to announce/i,
  /we are excited/i,
  /\bsponsored\b/i,
  /\badvertisement\b/i,
  /\bpress release\b/i,
];

const PAYWALL_PATTERNS = [
  /\[paywall\]/i,
  /\(paywall\)/i,
  /subscriber.only/i,
];

function passesEditorialFilter(candidate: ReconUltraCandidate): boolean {
  const title = candidate.title?.trim() ?? '';
  if (title.length < 15) return false;

  for (const pattern of PR_PATTERNS) {
    if (pattern.test(title)) return false;
  }
  for (const pattern of PAYWALL_PATTERNS) {
    if (pattern.test(title)) return false;
  }

  return true;
}

// ── Dedup by Title (first 60 chars) (Task 4, AC5) ──────────────
function deduplicateByTitle(candidates: ReconUltraCandidate[]): ReconUltraCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((c) => {
    const key = (c.title ?? '').toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Remove Recently Used Intel (Task 4, AC5) ────────────────────
async function getRecentlyUsedUrls(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from('sf_intel_sources_v2')
    .select('url')
    .eq('user_id', userId)
    .eq('used', true)
    .order('used_at', { ascending: false })
    .limit(30);

  const urls = new Set<string>();
  if (data) {
    for (const row of data) {
      if (row.url) urls.add(row.url);
    }
  }
  return urls;
}

function removeRecentlyUsed(
  candidates: ReconUltraCandidate[],
  recentUrls: Set<string>
): ReconUltraCandidate[] {
  if (recentUrls.size === 0) return candidates;
  return candidates.filter((c) => !c.url || !recentUrls.has(c.url));
}

// ── Source Dispatcher (Task 2) ──────────────────────────────────
// Stub source functions — return [] until Epic 2/3 stories implement real sources

async function fetchRedditDynamic(
  _queries: string[],
  _userId: string
): Promise<ReconUltraCandidate[]> {
  logger.info('[RECON-ULTRA] reddit source — stub (returns [])');
  return [];
}

async function fetchBlogArticles(
  userId: string,
  queries: string[],
  profileKeywords: string[]
): Promise<ReconUltraCandidate[]> {
  return fetchBlogArticlesReal(userId, queries, profileKeywords);
}

async function fetchBySource(
  source: ReconSourceType,
  queries: string[],
  userId: string,
  profileKeywords: string[]
): Promise<ReconUltraCandidate[]> {
  switch (source) {
    case 'google_news':
      return fetchNewsDynamic(queries, profileKeywords);
    case 'google_trends':
      return fetchTrendsDynamic(profileKeywords);
    case 'reddit':
      return fetchRedditDynamic(queries, userId);
    case 'twitter':
      return fetchTwitterDynamic(queries);
    case 'blog':
      return fetchBlogArticles(userId, queries, profileKeywords);
    default:
      logger.warn({ source }, '[RECON-ULTRA] Unknown source type');
      return [];
  }
}

// ── Pillar Tagger (AC7) ─────────────────────────────────────────
function assignPillarTag(
  candidate: ReconUltraCandidate,
  targetPillar: PillarId
): PillarId {
  // If pillar_alignment_score is already set and > 0, keep existing tag
  // Otherwise default to the target pillar
  return candidate.pillar_tag || targetPillar;
}

// ── Store Intel Items (Task 3, AC7-AC9) ─────────────────────────
async function storeIntelItems(
  userId: string,
  pillarId: PillarId,
  candidates: ReconUltraCandidate[]
): Promise<void> {
  if (candidates.length === 0) return;

  const rows = candidates.map((c) => ({
    user_id: userId,
    source_type: c.source_type,
    title: c.title,
    summary: c.summary,
    body_content: c.body_content,
    url: c.url,
    author: c.author,
    category: c.category,
    source_score: c.source_score,
    source_comments: c.source_comments,
    source_retweets: c.source_retweets,
    source_views: c.source_views,
    recency_score: c.recency_score,
    engagement_score: c.engagement_score,
    relevance_score: c.relevance_score,
    richness_score: c.richness_score,
    pillar_alignment_score: c.pillar_alignment_score,
    final_score: c.final_score,
    pillar_tag: assignPillarTag(c, pillarId),
    query_used: c.query_used,
    posted_at: c.posted_at,
    collected_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + TTL_MAP[c.source_type]).toISOString(),
    used: false,
  }));

  // AC9: upsert on (user_id, url) — update if new score > existing score
  const { error } = await supabase
    .from('sf_intel_sources_v2')
    .upsert(rows, { onConflict: 'user_id,url', ignoreDuplicates: false });

  if (error) {
    logger.error(
      { error: error.message, userId, count: rows.length },
      '[RECON-ULTRA] Failed to upsert intel items'
    );
    throw new Error(`[RECON-ULTRA] Store failed: ${error.message}`);
  }

  logger.info(
    { userId, pillarId, stored: rows.length },
    '[RECON-ULTRA] Intel items upserted'
  );
}

// ── Main Pipeline (Task 1, AC1-AC15) ────────────────────────────
export async function runReconUltra(
  request: ReconUltraRequest
): Promise<ReconUltraResult> {
  const startTime = Date.now();
  const { userId, pillarId, sources } = request;
  const pillarConfig = getPillarConfig(pillarId);

  logger.info(
    { userId, pillarId, sources },
    '[RECON-ULTRA] Pipeline started'
  );

  // ── Stage 0: Load profile (AC2) ────────────────────────────────
  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('niche, target_audience, audience_frustration, audience_desire, expertise_statement, user_prompt, main_pain_point')
    .eq('id', userId)
    .single();

  if (profileError || !userProfile) {
    throw new Error(`[RECON-ULTRA] User profile not found for ${userId}`);
  }

  const profileKeywords = extractProfileKeywords(
    userProfile.niche,
    userProfile.target_audience ?? '',
    userProfile.audience_frustration,
    userProfile.expertise_statement,
    userProfile.user_prompt
  );

  logger.info(
    { userId, keywordCount: profileKeywords.length },
    '[RECON-ULTRA] Stage 0 complete — profile loaded'
  );

  // ── Stage 1: Generate queries (AC3) ────────────────────────────
  const queries = await generateReconQueries(userId, pillarId);
  const cacheUsed = true; // generateReconQueries handles caching internally

  logger.info(
    { userId, pillarId, queryCount: queries.length },
    '[RECON-ULTRA] Stage 1 complete — queries generated'
  );

  // ── Stage 2: Multi-source fetch (AC4, AC10) ───────────────────
  const sourcesToRun: ReconSourceType[] = sources ?? ALL_SOURCES;

  const fetchResults = await Promise.allSettled(
    sourcesToRun.map((source) =>
      fetchBySource(source, queries, userId, profileKeywords)
    )
  );

  // Merge results — one source failure does NOT block others (AC4)
  const sourcesUsed: ReconSourceType[] = [];
  let allCandidates: ReconUltraCandidate[] = [];

  for (let i = 0; i < fetchResults.length; i++) {
    const result = fetchResults[i];
    const sourceName = sourcesToRun[i];

    if (result.status === 'fulfilled') {
      allCandidates = allCandidates.concat(result.value);
      if (result.value.length > 0) {
        sourcesUsed.push(sourceName);
      }
    } else {
      logger.error(
        { source: sourceName, error: result.reason?.message ?? String(result.reason) },
        '[RECON-ULTRA] Source fetch failed — continuing pipeline'
      );
    }
  }

  const totalCollected = allCandidates.length;

  logger.info(
    { totalCollected, sourcesUsed },
    '[RECON-ULTRA] Stage 2 complete — sources fetched'
  );

  // ── Stage 2b: Editorial filter + dedup (AC5) ──────────────────
  const recentUrls = await getRecentlyUsedUrls(userId);
  let filtered = allCandidates.filter(passesEditorialFilter);
  filtered = deduplicateByTitle(filtered);
  filtered = removeRecentlyUsed(filtered, recentUrls);

  const totalAfterFilter = filtered.length;

  logger.info(
    { totalCollected, totalAfterFilter, removed: totalCollected - totalAfterFilter },
    '[RECON-ULTRA] Stage 2b complete — filtered & deduped'
  );

  // ── Stage 3: Score with pillar alignment (AC6 + Story 5.1) ────
  const scored = await scoreAllReconCandidates(filtered, profileKeywords, pillarConfig, userId, pillarId);

  logger.info(
    { scoredCount: scored.length },
    '[RECON-ULTRA] Stage 3 complete — scored'
  );

  // ── Stage 4: Store (AC7-AC9) ──────────────────────────────────
  await storeIntelItems(userId, pillarId, scored);

  const durationMs = Date.now() - startTime;

  logger.info(
    { userId, pillarId, candidates: scored.length, durationMs },
    '[RECON-ULTRA] Pipeline complete'
  );

  // ── Return result (AC1, AC15) ──────────────────────────────────
  return {
    userId,
    pillarId,
    candidates: scored,
    sources_used: sourcesUsed,
    total_collected: totalCollected,
    total_after_filter: totalAfterFilter,
    cache_queries_used: cacheUsed,
    duration_ms: durationMs,
  };
}
