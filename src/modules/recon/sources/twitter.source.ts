import { chromium } from 'playwright-extra';
import type { BrowserContext, Page } from 'playwright-core';
import stealth from 'puppeteer-extra-plugin-stealth';
import { env } from '../../../config/env.js';
import { logger } from '../../../config/logger.js';
import { humanDelay, shortDelay } from '../../../shared/utils/delay.js';
import type { RawIntelItem } from '../recon.types.js';

chromium.use(stealth());

// ─── Types ──────────────────────────────────────────────────────────────────

interface RawTweet {
  text: string;
  author: string;
  likes: number;
  retweets: number;
  replies: number;
  views: number;
  url: string;
  postedAt: string | null;
}

// ─── Config ─────────────────────────────────────────────────────────────────

const PROFILES = env.TWITTER_PROFILES.split(',').map((p) => p.trim()).filter(Boolean);
const QUERIES = env.TWITTER_SEARCH_QUERIES.split('||').map((q) => q.trim()).filter(Boolean);
const MAX_POSTS = env.TWITTER_MAX_POSTS;
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

// ─── DOM Extraction (runs inside the browser) ──────────────────────────────

function extractTweetsScript() {
  const articles = document.querySelectorAll('article[data-testid="tweet"]');
  const extracted: Array<{
    text: string;
    author: string;
    likes: number;
    retweets: number;
    replies: number;
    views: number;
    url: string;
    postedAt: string | null;
  }> = [];

  articles.forEach((el) => {
    const textEl = el.querySelector('[data-testid="tweetText"]');
    const authorEl = el.querySelector('a[role="link"][href^="/"]');
    const timeEl = el.querySelector('time');
    const linkEl = el.querySelector('a[href*="/status/"]');

    const text = textEl?.textContent?.trim() || '';
    const author = authorEl?.getAttribute('href')?.replace('/', '') || '';
    const postedAt = timeEl?.getAttribute('datetime') || null;
    const statusUrl = linkEl?.getAttribute('href') || '';

    // Parse metrics from aria-labels
    const parseMetric = (testId: string): number => {
      const btn = el.querySelector(`[data-testid="${testId}"]`);
      const label = btn?.getAttribute('aria-label') || '0';
      return parseInt(label.replace(/[^\d]/g, '')) || 0;
    };

    const likes = parseMetric('like');
    const retweets = parseMetric('retweet');
    const replies = parseMetric('reply');

    // Views are sometimes in a separate analytics link
    let views = 0;
    const viewEl = el.querySelector('a[href*="/analytics"]');
    if (viewEl) {
      const viewLabel = viewEl.getAttribute('aria-label') || '0';
      views = parseInt(viewLabel.replace(/[^\d]/g, '')) || 0;
    }

    if (text.length > 10) {
      extracted.push({
        text,
        author,
        likes,
        retweets,
        replies,
        views,
        url: statusUrl ? `https://x.com${statusUrl}` : '',
        postedAt,
      });
    }
  });

  return extracted;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function isWithin24Hours(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const postDate = new Date(dateStr).getTime();
  const now = Date.now();
  return now - postDate <= TWENTY_FOUR_HOURS_MS;
}

function getTodaySince(): string {
  const d = new Date(Date.now() - TWENTY_FOUR_HOURS_MS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

async function scrollAndCollect(page: Page, scrollCount: number = 3): Promise<RawTweet[]> {
  await humanDelay(3000, 6000);

  for (let i = 0; i < scrollCount; i++) {
    await page.evaluate(() => window.scrollBy(0, 800));
    await shortDelay(1000, 2000);
  }

  // NOTE: Using a string literal to completely bypass tsx/esbuild transpilation.
  // Passing functions to page.evaluate() causes __name ReferenceError in browser.
  return page.evaluate(`(() => {
    var articles = document.querySelectorAll('article[data-testid="tweet"]');
    var extracted = [];
    for (var i = 0; i < articles.length; i++) {
      var el = articles[i];
      var textEl = el.querySelector('[data-testid="tweetText"]');
      var authorEl = el.querySelector('a[role="link"][href^="/"]');
      var timeEl = el.querySelector('time');
      var linkEl = el.querySelector('a[href*="/status/"]');
      var text = textEl ? (textEl.textContent || '').trim() : '';
      var author = authorEl ? (authorEl.getAttribute('href') || '').replace('/', '') : '';
      var postedAt = timeEl ? timeEl.getAttribute('datetime') : null;
      var statusUrl = linkEl ? linkEl.getAttribute('href') : '';
      function parseMetric(testId) {
        var btn = el.querySelector('[data-testid="' + testId + '"]');
        var label = btn ? (btn.getAttribute('aria-label') || '0') : '0';
        return parseInt(label.replace(/[^\\d]/g, '')) || 0;
      }
      var likes = parseMetric('like');
      var retweets = parseMetric('retweet');
      var replies = parseMetric('reply');
      var views = 0;
      var viewEl = el.querySelector('a[href*="/analytics"]');
      if (viewEl) {
        var viewLabel = viewEl.getAttribute('aria-label') || '0';
        views = parseInt(viewLabel.replace(/[^\\d]/g, '')) || 0;
      }
      if (text.length > 10) {
        extracted.push({
          text: text,
          author: author,
          likes: likes,
          retweets: retweets,
          replies: replies,
          views: views,
          url: statusUrl ? 'https://x.com' + statusUrl : '',
          postedAt: postedAt
        });
      }
    }
    return extracted;
  })()`) as Promise<RawTweet[]>;
}

// ─── Profile Scraping ───────────────────────────────────────────────────────

async function scrapeTwitterProfiles(context: BrowserContext): Promise<RawTweet[]> {
  const allTweets: RawTweet[] = [];

  for (const handle of PROFILES) {
    try {
      const page = await context.newPage();
      const profileUrl = `https://x.com/${handle}`;

      logger.info({ handle }, '[RECON:TWITTER] Visiting profile');
      await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const tweets = await scrollAndCollect(page, 3);

      // Filter only last 24h
      const recentTweets = tweets.filter((t) => isWithin24Hours(t.postedAt));

      if (recentTweets.length === 0) {
        logger.info({ handle }, '[RECON:TWITTER] No recent posts (24h), skipping');
      } else {
        logger.info(
          { handle, total: tweets.length, recent: recentTweets.length },
          '[RECON:TWITTER] Profile scraped'
        );
        allTweets.push(...recentTweets);
      }

      await page.close();
      await humanDelay(4000, 8000);
    } catch (err) {
      logger.error({ handle, error: (err as Error).message }, '[RECON:TWITTER] Profile scrape failed');
    }
  }

  return allTweets;
}

// ─── Query Scraping ─────────────────────────────────────────────────────────

async function scrapeTwitterQueries(context: BrowserContext): Promise<RawTweet[]> {
  const allTweets: RawTweet[] = [];
  const sinceDate = getTodaySince();

  for (const query of QUERIES) {
    try {
      const page = await context.newPage();
      const fullQuery = `${query} since:${sinceDate}`;
      const searchUrl = `https://x.com/search?q=${encodeURIComponent(fullQuery)}&src=typed_query&f=top`;

      logger.info({ query: query.slice(0, 80) }, '[RECON:TWITTER] Executing query');
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      const tweets = await scrollAndCollect(page, 4);

      logger.info(
        { query: query.slice(0, 80), found: tweets.length },
        '[RECON:TWITTER] Query scraped'
      );

      allTweets.push(...tweets);
      await page.close();
      await humanDelay(5000, 10000);
    } catch (err) {
      logger.error(
        { query: query.slice(0, 80), error: (err as Error).message },
        '[RECON:TWITTER] Query scrape failed'
      );
    }
  }

  return allTweets;
}

// ─── Categorization & Scoring ───────────────────────────────────────────────

function categorizeTwitter(text: string): RawIntelItem['category'] {
  const lower = text.toLowerCase();
  if (/model|gpt|claude|gemini|llama|benchmark/i.test(lower)) return 'ai_models';
  if (/tool|app|product|launch|release/i.test(lower)) return 'ai_tools';
  if (/automat|workflow|no.?code|agent/i.test(lower)) return 'automation';
  if (/code|dev|program|framework/i.test(lower)) return 'coding';
  if (/fund|acqui|billion|startup/i.test(lower)) return 'industry_news';
  if (/how|guide|tutorial|learn|prompt/i.test(lower)) return 'tutorials';
  return 'ai_tools';
}

function scoreTwitterRelevance(tweet: RawTweet): number {
  let score = 5.0;

  // Likes weight
  if (tweet.likes > 5000) score += 2.5;
  else if (tweet.likes > 1000) score += 2;
  else if (tweet.likes > 100) score += 1;

  // Retweets weight
  if (tweet.retweets > 500) score += 1;
  else if (tweet.retweets > 50) score += 0.5;

  // Views weight
  if (tweet.views > 100000) score += 1;

  // Content relevance
  if (/ai|ia|artificial|intelig|agent|rag|llm/i.test(tweet.text)) score += 0.5;

  return Math.min(Math.round(score * 10) / 10, 10);
}

// ─── Main Export ────────────────────────────────────────────────────────────

export async function scrapeTwitter(): Promise<RawIntelItem[]> {
  const results: RawIntelItem[] = [];

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      locale: 'en-US',
    });

    // Phase 1: Profile scraping
    logger.info({ profiles: PROFILES.length }, '[RECON:TWITTER] Starting profile sweep');
    const profileTweets = await scrapeTwitterProfiles(context);

    // Phase 2: Query scraping
    logger.info({ queries: QUERIES.length }, '[RECON:TWITTER] Starting query sweep');
    const queryTweets = await scrapeTwitterQueries(context);

    // Merge & deduplicate by URL
    const allTweets = [...profileTweets, ...queryTweets];
    const seen = new Set<string>();
    const unique: RawTweet[] = [];

    for (const tweet of allTweets) {
      const key = tweet.url || `${tweet.author}:${tweet.text.slice(0, 50)}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(tweet);
      }
    }

    // Sort by engagement (likes + retweets) descending, take top MAX_POSTS
    unique.sort((a, b) => (b.likes + b.retweets) - (a.likes + a.retweets));
    const topTweets = unique.slice(0, MAX_POSTS);

    // Convert to RawIntelItem
    for (const tweet of topTweets) {
      results.push({
        source_type: 'twitter',
        title: tweet.text.slice(0, 200),
        summary: tweet.text.length > 200 ? tweet.text : null,
        url: tweet.url || null,
        author: tweet.author || null,
        category: categorizeTwitter(tweet.text),
        source_score: tweet.likes,
        source_comments: null,
        source_retweets: tweet.retweets,
        source_replies: tweet.replies,
        source_views: tweet.views,
        posted_at: tweet.postedAt,
        relevance_score: scoreTwitterRelevance(tweet),
      });
    }

    logger.info(
      {
        profiles_collected: profileTweets.length,
        queries_collected: queryTweets.length,
        unique: unique.length,
        final: results.length,
      },
      '[RECON:TWITTER] Collection complete'
    );
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON:TWITTER] Browser launch failed');
  } finally {
    if (browser) await browser.close();
  }

  return results;
}
