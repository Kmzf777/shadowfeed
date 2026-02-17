import Snoowrap from 'snoowrap';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import type { RawIntelItem } from '../recon.types.js';

function createRedditClient(): Snoowrap | null {
  if (!env.REDDIT_CLIENT_ID || env.REDDIT_CLIENT_ID === 'PLACEHOLDER') {
    logger.warn('[RECON:REDDIT] Reddit credentials not configured, skipping');
    return null;
  }

  return new Snoowrap({
    userAgent: 'SHADOWFEED/1.0 (content intelligence)',
    clientId: env.REDDIT_CLIENT_ID,
    clientSecret: env.REDDIT_CLIENT_SECRET,
    username: env.REDDIT_USERNAME,
    password: env.REDDIT_PASSWORD,
  });
}

function categorizeReddit(title: string, subreddit: string): RawIntelItem['category'] {
  const lower = (title + ' ' + subreddit).toLowerCase();
  if (/model|gpt|claude|gemini|llama|benchmark|finetun/i.test(lower)) return 'ai_models';
  if (/tool|app|product|launch|release/i.test(lower)) return 'ai_tools';
  if (/automat|workflow|no.?code|zapier/i.test(lower)) return 'automation';
  if (/code|dev|program|framework|api|localllama/i.test(lower)) return 'coding';
  if (/fund|acqui|billion|startup|company/i.test(lower)) return 'industry_news';
  if (/how|guide|tutorial|learn|tip/i.test(lower)) return 'tutorials';
  if (/opinion|debate|think|future/i.test(lower)) return 'opinion';
  return 'ai_tools';
}

export async function scrapeReddit(): Promise<RawIntelItem[]> {
  const reddit = createRedditClient();
  if (!reddit) return [];

  const subreddits = env.REDDIT_SUBREDDITS.split(',').map((s) => s.trim()).filter(Boolean);
  const results: RawIntelItem[] = [];
  const MIN_SCORE = 100;

  for (const sub of subreddits) {
    try {
      const posts = await reddit.getSubreddit(sub).getHot({ limit: 15 });

      for (const post of posts) {
        if (post.score < MIN_SCORE) continue;
        if (post.stickied) continue;

        results.push({
          source_type: 'reddit',
          title: post.title,
          summary: post.selftext?.slice(0, 500) || null,
          url: post.url.startsWith('/r/') ? `https://reddit.com${post.url}` : post.url,
          author: post.author?.name || null,
          category: categorizeReddit(post.title, sub),
          source_score: post.score,
          source_comments: post.num_comments,
          source_retweets: null,
          source_replies: null,
          source_views: null,
          posted_at: null,
          relevance_score: scoreRedditRelevance(post.score, post.num_comments),
        });
      }

      logger.info({ subreddit: sub, fetched: posts.length }, '[RECON:REDDIT] Subreddit scraped');
    } catch (err) {
      logger.error({ subreddit: sub, error: (err as Error).message }, '[RECON:REDDIT] Subreddit failed');
    }
  }

  logger.info({ total: results.length }, '[RECON:REDDIT] Collection complete');
  return results;
}

function scoreRedditRelevance(score: number, comments: number): number {
  let relevance = 5.0;
  if (score > 1000) relevance += 2;
  else if (score > 500) relevance += 1.5;
  else if (score > 200) relevance += 1;
  if (comments > 100) relevance += 1;
  return Math.min(relevance, 10);
}
