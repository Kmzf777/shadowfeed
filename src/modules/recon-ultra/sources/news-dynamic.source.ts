import RSSParser from 'rss-parser';
import { logger } from '../../../config/logger.js';
import type { ReconUltraCandidate } from '../recon-ultra.types.js';

const defaultParser = new RSSParser();

export interface RSSParserLike {
  parseURL(url: string): Promise<{ items: Record<string, unknown>[] }>;
}

export async function fetchNewsDynamic(
  queries: string[],
  profileKeywords: string[],
  parser: RSSParserLike = defaultParser
): Promise<ReconUltraCandidate[]> {
  const fetchPromises = queries.map((q) => fetchNewsForQuery(q, profileKeywords, parser));
  const results = await Promise.allSettled(fetchPromises);

  const candidates: ReconUltraCandidate[] = [];
  for (const r of results) {
    if (r.status === 'fulfilled') {
      candidates.push(...r.value);
    } else {
      logger.error(
        { error: r.reason?.message ?? String(r.reason) },
        '[RECON-ULTRA:NEWS] Query fetch failed — continuing'
      );
    }
  }

  logger.info(
    { queryCount: queries.length, candidateCount: candidates.length },
    '[RECON-ULTRA:NEWS] fetchNewsDynamic complete'
  );

  return candidates;
}

async function fetchNewsForQuery(
  query: string,
  _profileKeywords: string[],
  parser: RSSParserLike
): Promise<ReconUltraCandidate[]> {
  const encoded = encodeURIComponent(query);
  const feedUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
  const feed = await parser.parseURL(feedUrl);

  return feed.items
    .slice(0, 8)
    .filter((item: Record<string, unknown>) => ((item.title as string) ?? '').length >= 5)
    .map((item: Record<string, unknown>) => ({
      source_type: 'google_news' as const,
      title: (item.title as string) ?? '',
      summary: ((item.contentSnippet as string) ?? '').slice(0, 500) || null,
      body_content: null,
      url: (item.link as string) ?? null,
      author: (item.creator as string) ?? null,
      category: null,
      source_score: null,
      source_comments: null,
      source_retweets: null,
      source_views: null,
      recency_score: 0,
      engagement_score: 0,
      relevance_score: 0,
      richness_score: 0,
      pillar_alignment_score: 0,
      final_score: 0,
      pillar_tag: 'educate' as const,
      query_used: query,
      posted_at: (item.isoDate as string) ?? null,
      expires_at: '',
    }));
}
