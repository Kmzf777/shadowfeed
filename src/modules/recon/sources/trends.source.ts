import googleTrends from 'google-trends-api';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import type { RawIntelItem } from '../recon.types.js';

export async function scrapeGoogleTrends(): Promise<RawIntelItem[]> {
  const keywords = env.GOOGLE_TRENDS_KEYWORDS.split(',').map((k) => k.trim()).filter(Boolean);
  const results: RawIntelItem[] = [];

  for (const keyword of keywords) {
    try {
      // Related queries for the keyword
      const relatedRaw = await googleTrends.relatedQueries({
        keyword,
        geo: 'BR',
        hl: 'pt-BR',
      });

      const related = JSON.parse(relatedRaw);
      const defaultData = related?.default;

      if (defaultData?.rankedList) {
        for (const list of defaultData.rankedList) {
          const queries = list.rankedKeyword || [];
          for (const q of queries.slice(0, 5)) {
            const queryText = q.query || '';
            if (!queryText || queryText.length < 3) continue;

            results.push({
              source_type: 'google_trends',
              title: `Trending: ${queryText}`,
              summary: `Related to "${keyword}" — ${q.formattedValue || 'rising'}`,
              url: q.link ? `https://trends.google.com${q.link}` : null,
              author: null,
              category: categorizeTrend(queryText),
              source_score: q.value || null,
              source_comments: null,
              source_retweets: null,
              source_replies: null,
              source_views: null,
              posted_at: null,
              relevance_score: scoreTrendRelevance(queryText, q.value),
            });
          }
        }
      }

      logger.info({ keyword }, '[RECON:TRENDS] Keyword processed');
    } catch (err) {
      logger.error({ keyword, error: (err as Error).message }, '[RECON:TRENDS] Keyword failed');
    }
  }

  // Deduplicate
  const seen = new Set<string>();
  const deduplicated = results.filter((item) => {
    const key = item.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  logger.info({ total: deduplicated.length }, '[RECON:TRENDS] Collection complete');
  return deduplicated;
}

function categorizeTrend(query: string): RawIntelItem['category'] {
  const lower = query.toLowerCase();
  if (/model|gpt|claude|gemini|llama/i.test(lower)) return 'ai_models';
  if (/tool|app|product/i.test(lower)) return 'ai_tools';
  if (/automat|workflow|no.?code/i.test(lower)) return 'automation';
  if (/code|dev|program/i.test(lower)) return 'coding';
  return 'ai_tools';
}

function scoreTrendRelevance(query: string, value?: number): number {
  let score = 5.0;
  if (value && value > 100) score += 2;
  if (/ai|ia|intelig|artificial/i.test(query)) score += 1.5;
  return Math.min(score, 10);
}
