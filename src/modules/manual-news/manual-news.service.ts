import { logger } from '../../config/logger.js';
import { scrapeUrl } from './url-scraper.js';
import { forgeCarousel } from '../forge/forge.service.js';
import { forgeAuthorityCarousel } from '../forge-authority/forge-authority.service.js';
import type { IntelSource, GeneratedPost } from '../../shared/types/global.types.js';

function categorizeContent(text: string): IntelSource['category'] {
  const lower = text.toLowerCase();
  if (/model|gpt|claude|gemini|llama|benchmark|finetun|parameter/i.test(lower)) return 'ai_models';
  if (/tool|app|product|launch|release|platform/i.test(lower)) return 'ai_tools';
  if (/automat|workflow|no.?code|zapier|make\.com/i.test(lower)) return 'automation';
  if (/code|dev|program|framework|api|sdk/i.test(lower)) return 'coding';
  if (/fund|acqui|billion|million|startup|company|ipo/i.test(lower)) return 'industry_news';
  if (/how.?to|guide|tutorial|learn|tip|trick/i.test(lower)) return 'tutorials';
  if (/opinion|debate|predict|future|think|believe/i.test(lower)) return 'opinion';
  return 'industry_news';
}

export async function generateFromUrl(
  url: string,
  pipeline: 'default' | 'authority',
  userId?: string
): Promise<GeneratedPost> {
  logger.info({ url, pipeline, userId }, '[MANUAL-NEWS] Starting generation from URL');

  // 1. Scrape URL content
  const scraped = await scrapeUrl(url);

  logger.info(
    {
      type: scraped.detectedType,
      title: scraped.title.slice(0, 80),
      contentLength: scraped.content.length,
    },
    '[MANUAL-NEWS] Content scraped'
  );

  // 2. Build manual IntelSource (URL deliberately omitted to prevent source citation)
  const manualSource: Partial<IntelSource> = {
    id: 'manual',
    source_type: 'manual',
    title: scraped.title,
    summary: scraped.content,
    raw_content: scraped.content,
    url: null,
    author: null,
    category: categorizeContent(scraped.title + ' ' + scraped.content),
    relevance_score: 10,
  };

  // 3. Call the chosen pipeline
  let post: GeneratedPost;

  if (pipeline === 'authority') {
    post = await forgeAuthorityCarousel(undefined, undefined, manualSource, userId);
  } else {
    post = await forgeCarousel(undefined, undefined, manualSource, userId);
  }

  logger.info(
    { postId: post.id, pipeline, theme: post.theme },
    '[MANUAL-NEWS] Post generated successfully'
  );

  return post;
}
