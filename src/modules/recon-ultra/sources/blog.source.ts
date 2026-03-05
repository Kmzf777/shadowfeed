import { chromium, type Browser, type Page } from 'playwright';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';
import RSSParser from 'rss-parser';
import { logger } from '../../../config/logger.js';
import { supabase } from '../../../config/supabase.js';
import type { ReconUltraCandidate, BlogSource, BlogScrapedArticle } from '../recon-ultra.types.js';

// ── User-Agent Pool (AC15) ───────────────────────────────────────
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
];

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ── Content Sanitization (AC18) ──────────────────────────────────
export function sanitizeContent(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .trim();
}

// ── Domain Rate Limiter (AC11, AC14) ─────────────────────────────
export class DomainRateLimiter {
  private lastRequestTime: Map<string, number> = new Map();
  private readonly minIntervalMs = 20_000; // 3 req/min = 20s between requests

  async waitForDomain(domain: string): Promise<void> {
    const lastTime = this.lastRequestTime.get(domain) ?? 0;
    const elapsed = Date.now() - lastTime;
    if (elapsed < this.minIntervalMs) {
      const delay = this.minIntervalMs - elapsed + randomDelay(2000, 5000);
      await new Promise((r) => setTimeout(r, delay));
    }
    this.lastRequestTime.set(domain, Date.now());
  }
}

// ── Browser Pool (AC12) ──────────────────────────────────────────
export class BrowserPool {
  private browser: Browser | null = null;
  private activePagesCount = 0;
  private readonly maxPages: number;
  private waitQueue: Array<() => void> = [];

  constructor(maxPages = 2) {
    this.maxPages = maxPages;
  }

  async getPage(): Promise<Page> {
    if (this.activePagesCount >= this.maxPages) {
      await new Promise<void>((resolve) => {
        this.waitQueue.push(resolve);
      });
    }
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
      });
    }
    this.activePagesCount++;
    const page = await this.browser.newPage();
    await page.setExtraHTTPHeaders({
      'User-Agent': getRandomUA(),
    });
    return page;
  }

  async releasePage(page: Page): Promise<void> {
    try {
      await page.close();
    } catch {
      // page may already be closed
    }
    this.activePagesCount--;
    const next = this.waitQueue.shift();
    if (next) next();
  }

  async destroy(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.activePagesCount = 0;
    this.waitQueue = [];
  }
}

// ── Cookie Consent Auto-Dismiss (AC16) ───────────────────────────
async function dismissCookieConsent(page: Page): Promise<void> {
  const selectors = [
    '[id*="cookie"] button[id*="accept"]',
    '[class*="cookie"] button[class*="accept"]',
    'button[aria-label*="Accept"]',
    'button[aria-label*="Agree"]',
    '#onetrust-accept-btn-handler',
    '.cookie-banner__accept',
    '[id*="consent"] button',
    'button[class*="consent"]',
  ];
  for (const sel of selectors) {
    try {
      await page.click(sel, { timeout: 1000 });
      break;
    } catch {
      // selector not found — try next
    }
  }
}

// ── Metadata Extraction ──────────────────────────────────────────
function extractAuthor(document: Document): string | null {
  const meta = document.querySelector('meta[name="author"]') as HTMLMetaElement | null;
  if (meta?.content) return meta.content;

  const ldJson = document.querySelector('script[type="application/ld+json"]');
  if (ldJson?.textContent) {
    try {
      const data = JSON.parse(ldJson.textContent);
      const author = data.author?.name ?? data.author;
      if (typeof author === 'string') return author;
    } catch {
      // invalid JSON
    }
  }
  return null;
}

function extractPublishedDate(document: Document): string | null {
  // meta article:published_time
  const metaTime = document.querySelector(
    'meta[property="article:published_time"]'
  ) as HTMLMetaElement | null;
  if (metaTime?.content) return metaTime.content;

  // ld+json datePublished
  const ldJson = document.querySelector('script[type="application/ld+json"]');
  if (ldJson?.textContent) {
    try {
      const data = JSON.parse(ldJson.textContent);
      if (data.datePublished) return data.datePublished;
    } catch {
      // invalid JSON
    }
  }

  // time element
  const timeEl = document.querySelector('time[datetime]');
  if (timeEl) return timeEl.getAttribute('datetime');

  return null;
}

function extractKeyQuotes(document: Document): string[] {
  const quotes: string[] = [];
  const blockquotes = document.querySelectorAll('blockquote');
  for (const bq of blockquotes) {
    const text = bq.textContent?.trim();
    if (text && text.length > 20 && text.length < 500) {
      quotes.push(text);
      if (quotes.length >= 3) break;
    }
  }
  return quotes;
}

// ── Fallback Extraction (AC6, AC7) ───────────────────────────────
async function fallbackExtraction(
  page: Page,
  url: string
): Promise<BlogScrapedArticle | null> {
  const result = await page.evaluate(() => {
    // Remove noise
    const removeSelectors = [
      'script', 'style', 'noscript', 'iframe', 'nav', 'footer',
      'aside', 'header', '.sidebar', '.nav', '.footer', '.header',
      '.menu', '.ad', '.ads', '.advertisement', '.cookie', '.popup',
      '.modal', '.social-share', '.comments', '#comments',
    ];
    removeSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((el) => el.remove());
    });

    // Try priority selectors
    const selectors = [
      'article', '[role="main"]', 'main', '.post-content',
      '.article-content', '.entry-content',
    ];
    let contentEl: HTMLElement | null = null;
    for (const sel of selectors) {
      contentEl = document.querySelector(sel);
      if (contentEl && contentEl.innerText.trim().length > 100) break;
      contentEl = null;
    }

    // Last resort: largest text block
    if (!contentEl) {
      const blocks = Array.from(document.querySelectorAll('div, section'));
      let maxLen = 0;
      for (const block of blocks) {
        const text = (block as HTMLElement).innerText?.trim() || '';
        if (text.length > maxLen) {
          maxLen = text.length;
          contentEl = block as HTMLElement;
        }
      }
    }

    const body = contentEl?.innerText?.trim() || document.body?.innerText?.trim() || '';
    const h1 = document.querySelector('h1');
    const title = h1?.innerText?.trim() || document.title || '';
    const authorMeta = document.querySelector('meta[name="author"]') as HTMLMetaElement | null;
    const author = authorMeta?.content || null;

    return { title, body, author };
  });

  if (!result.body || result.body.length < 300) return null;

  return {
    url,
    title: result.title,
    body_content: sanitizeContent(result.body).slice(0, 5000),
    author: result.author,
    posted_at: null,
    word_count: result.body.split(/\s+/).length,
    key_quotes: [],
  };
}

// ── Article Scraper (AC4, AC5, AC8, AC9, AC10, AC13) ─────────────
async function scrapeArticle(
  page: Page,
  url: string
): Promise<BlogScrapedArticle | null> {
  try {
    // Navigate with 30s timeout (AC13)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    // Auto-dismiss cookie consent (AC16)
    await dismissCookieConsent(page);

    // Wait for content hydration
    await page.waitForTimeout(2000);

    // Get full page HTML
    const html = await page.content();

    // Primary: Readability.js (AC5)
    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    const textContent = article?.textContent ?? '';
    if (article && textContent.length >= 300) {
      const cleanBody = sanitizeContent(textContent).slice(0, 5000);
      return {
        url,
        title: article.title ?? '',
        body_content: cleanBody,
        author: extractAuthor(dom.window.document),
        posted_at: extractPublishedDate(dom.window.document),
        word_count: textContent.split(/\s+/).length,
        key_quotes: extractKeyQuotes(dom.window.document),
      };
    }

    // Fallback: CSS selectors + largest text block (AC6, AC7)
    return await fallbackExtraction(page, url);
  } catch (err) {
    logger.warn(
      { url, error: (err as Error).message },
      '[BLOG-SCRAPER] Article scrape failed'
    );
    return null;
  }
}

// ── Article Discovery via Google News RSS (AC3) ──────────────────
export interface RSSParserLike {
  parseURL(url: string): Promise<{ items: Record<string, unknown>[] }>;
}

const defaultParser = new RSSParser();

export async function discoverArticleUrls(
  blogDomain: string,
  queries: string[],
  parser: RSSParserLike = defaultParser
): Promise<string[]> {
  const urls = new Set<string>();
  const topQueries = queries.slice(0, 2); // top 2 queries per blog

  for (const query of topQueries) {
    try {
      const encoded = encodeURIComponent(`site:${blogDomain} ${query}`);
      const feedUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`;
      const feed = await parser.parseURL(feedUrl);

      for (const item of feed.items) {
        const link = item.link as string | undefined;
        if (link && link.includes(blogDomain)) {
          urls.add(link);
        }
        if (urls.size >= 5) break; // max 5 per blog
      }
    } catch (err) {
      logger.warn(
        { blogDomain, query, error: (err as Error).message },
        '[BLOG-SCRAPER] RSS discovery failed for query'
      );
    }
    if (urls.size >= 5) break;
  }

  return Array.from(urls);
}

// ── Main Export (AC1, AC2) ───────────────────────────────────────
export async function fetchBlogArticles(
  userId: string,
  queries: string[],
  _profileKeywords: string[],
  deps: { parser?: RSSParserLike } = {}
): Promise<ReconUltraCandidate[]> {
  // AC2: Load user's active blog sources
  const { data: blogSources, error } = await supabase
    .from('sf_user_blog_sources')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    logger.error(
      { userId, error: error.message },
      '[BLOG-SCRAPER] Failed to load blog sources'
    );
    return [];
  }

  if (!blogSources || blogSources.length === 0) {
    logger.info({ userId }, '[BLOG-SCRAPER] No active blog sources — returning []');
    return [];
  }

  const parser = deps.parser ?? defaultParser;
  const rateLimiter = new DomainRateLimiter();
  const pool = new BrowserPool(2);
  const candidates: ReconUltraCandidate[] = [];

  try {
    for (const source of blogSources as BlogSource[]) {
      try {
        const domain = new URL(source.blog_url).hostname;

        // Discover article URLs via RSS
        const articleUrls = await discoverArticleUrls(domain, queries, parser);

        if (articleUrls.length === 0) {
          logger.info(
            { domain, blogName: source.blog_name },
            '[BLOG-SCRAPER] No articles discovered for blog'
          );
          continue;
        }

        // Scrape each discovered article
        for (const articleUrl of articleUrls) {
          await rateLimiter.waitForDomain(domain);

          const page = await pool.getPage();
          try {
            const article = await scrapeArticle(page, articleUrl);
            if (article) {
              candidates.push(articleToCandidate(article, queries[0] ?? ''));
            }
          } finally {
            await pool.releasePage(page);
          }
        }

        // Update last_scraped_at
        await supabase
          .from('sf_user_blog_sources')
          .update({ last_scraped_at: new Date().toISOString() })
          .eq('id', source.id);
      } catch (err) {
        logger.error(
          { blogUrl: source.blog_url, error: (err as Error).message },
          '[BLOG-SCRAPER] Blog source processing failed — continuing to next'
        );
      }
    }
  } finally {
    await pool.destroy();
  }

  logger.info(
    { userId, blogCount: blogSources.length, candidateCount: candidates.length },
    '[BLOG-SCRAPER] fetchBlogArticles complete'
  );

  return candidates;
}

// ── Candidate Mapper ─────────────────────────────────────────────
function articleToCandidate(
  article: BlogScrapedArticle,
  queryUsed: string
): ReconUltraCandidate {
  return {
    source_type: 'blog',
    title: article.title,
    summary: article.body_content.slice(0, 500) || null,
    body_content: article.body_content,
    url: article.url,
    author: article.author,
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
    query_used: queryUsed,
    posted_at: article.posted_at,
    expires_at: '',
  };
}
