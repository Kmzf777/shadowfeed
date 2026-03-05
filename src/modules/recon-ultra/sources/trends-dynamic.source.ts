import googleTrends from 'google-trends-api';
import { logger } from '../../../config/logger.js';
import type { ReconUltraCandidate } from '../recon-ultra.types.js';

export interface GoogleTrendsClient {
  relatedQueries(params: { keyword: string; geo: string; hl: string }): Promise<string>;
}

const defaultClient: GoogleTrendsClient = googleTrends;

export async function fetchTrendsDynamic(
  profileKeywords: string[],
  client: GoogleTrendsClient = defaultClient
): Promise<ReconUltraCandidate[]> {
  const keywords = profileKeywords.slice(0, 5);

  if (keywords.length === 0) {
    logger.warn('[RECON-ULTRA:TRENDS] No profile keywords provided');
    return [];
  }

  const fetchPromises = keywords.map((kw) => fetchTrendsForKeyword(kw, client));
  const results = await Promise.allSettled(fetchPromises);

  const candidates: ReconUltraCandidate[] = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === 'fulfilled') {
      candidates.push(...r.value);
    } else {
      logger.error(
        { keyword: keywords[i], error: r.reason?.message ?? String(r.reason) },
        '[RECON-ULTRA:TRENDS] Keyword fetch failed — continuing'
      );
    }
  }

  logger.info(
    { keywordCount: keywords.length, candidateCount: candidates.length },
    '[RECON-ULTRA:TRENDS] fetchTrendsDynamic complete'
  );

  return candidates;
}

async function fetchTrendsForKeyword(
  keyword: string,
  client: GoogleTrendsClient
): Promise<ReconUltraCandidate[]> {
  const relatedRaw = await client.relatedQueries({
    keyword,
    geo: 'US',
    hl: 'en',
  });

  const related = JSON.parse(relatedRaw);
  const rankedList = related?.default?.rankedList;

  if (!rankedList || !Array.isArray(rankedList)) {
    logger.warn({ keyword }, '[RECON-ULTRA:TRENDS] No rankedList returned');
    return [];
  }

  const candidates: ReconUltraCandidate[] = [];

  for (const list of rankedList) {
    const queries = list.rankedKeyword || [];
    for (const q of queries.slice(0, 5)) {
      const queryText: string = q.query || '';
      if (!queryText || queryText.length < 3) continue;

      candidates.push({
        source_type: 'google_trends',
        title: `Trending: ${queryText}`,
        summary: `Related to "${keyword}" — ${q.formattedValue || 'rising'}`,
        body_content: null,
        url: q.link ? `https://trends.google.com${q.link}` : null,
        author: null,
        category: null,
        source_score: q.value ?? null,
        source_comments: null,
        source_retweets: null,
        source_views: null,
        recency_score: 0,
        engagement_score: 0,
        relevance_score: 0,
        richness_score: 0,
        pillar_alignment_score: 0,
        final_score: 0,
        pillar_tag: 'educate',
        query_used: keyword,
        posted_at: null,
        expires_at: '',
      });
    }
  }

  logger.info(
    { keyword, trendCount: candidates.length },
    '[RECON-ULTRA:TRENDS] Keyword processed'
  );

  return candidates;
}
