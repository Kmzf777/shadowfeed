import RSSParser from 'rss-parser';
import { logger } from '../../../config/logger.js';
import type { RawIntelItem } from '../recon.types.js';

const parser = new RSSParser();

const NEWS_FEEDS = [
  'https://news.google.com/rss/search?q=artificial+intelligence&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=AI+tools&hl=en-US&gl=US&ceid=US:en',
  'https://news.google.com/rss/search?q=inteligencia+artificial&hl=pt-BR&gl=BR&ceid=BR:pt-419',
];

function categorizeNews(title: string): RawIntelItem['category'] {
  const lower = title.toLowerCase();

  if (/model|gpt|claude|gemini|llama|benchmark|parameter/i.test(lower)) return 'ai_models';
  if (/tool|app|product|launch|release|platform/i.test(lower)) return 'ai_tools';
  if (/automat|workflow|no.?code|zapier|make\.com/i.test(lower)) return 'automation';
  if (/code|dev|program|framework|api|sdk/i.test(lower)) return 'coding';
  if (/fund|acqui|billion|million|startup|company|ipo/i.test(lower)) return 'industry_news';
  if (/how.?to|guide|tutorial|learn|tip|trick/i.test(lower)) return 'tutorials';
  if (/opinion|debate|predict|future|think|believe/i.test(lower)) return 'opinion';

  return 'ai_tools';
}

function scoreRelevance(title: string): number {
  let score = 5.0;
  const lower = title.toLowerCase();

  // Boost for high-interest topics
  if (/chatgpt|openai|google|gemini|claude|anthropic|meta|llama/i.test(lower)) score += 2;
  if (/breaking|just|new|launch|releas/i.test(lower)) score += 1;
  if (/brasil|português|br\b/i.test(lower)) score += 1;

  return Math.min(score, 10);
}

export async function scrapeGoogleNews(): Promise<RawIntelItem[]> {
  const results: RawIntelItem[] = [];

  for (const feedUrl of NEWS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items.slice(0, 10)) {
        if (!item.title || item.title.length < 5) continue;

        results.push({
          source_type: 'google_news',
          title: item.title,
          summary: item.contentSnippet?.slice(0, 500) || null,
          url: item.link || null,
          author: item.creator || null,
          category: categorizeNews(item.title),
          source_score: null,
          source_comments: null,
          source_retweets: null,
          source_replies: null,
          source_views: null,
          posted_at: item.isoDate || null,
          relevance_score: scoreRelevance(item.title),
        });
      }

      logger.info({ feed: feedUrl, items: feed.items.length }, '[RECON:NEWS] Feed parsed');
    } catch (err) {
      logger.error({ feed: feedUrl, error: (err as Error).message }, '[RECON:NEWS] Feed parse failed');
    }
  }

  // Deduplicate by title similarity
  const seen = new Set<string>();
  const deduplicated = results.filter((item) => {
    const key = item.title.toLowerCase().slice(0, 60);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  logger.info({ total: deduplicated.length }, '[RECON:NEWS] Collection complete');
  return deduplicated;
}
