import puppeteer from 'puppeteer';
import { logger } from '../../config/logger.js';

export interface ScrapedContent {
  title: string;
  content: string;
  author: string | null;
  url: string;
  detectedType: 'reddit' | 'twitter' | 'blog';
}

export function detectUrlType(url: string): 'reddit' | 'twitter' | 'blog' {
  const lower = url.toLowerCase();
  if (lower.includes('reddit.com') || lower.includes('redd.it')) return 'reddit';
  if (lower.includes('x.com') || lower.includes('twitter.com')) return 'twitter';
  return 'blog';
}

export async function scrapeUrl(url: string): Promise<ScrapedContent> {
  const type = detectUrlType(url);
  logger.info({ url, type }, '[URL-SCRAPER] Scraping URL');

  switch (type) {
    case 'reddit':
      return scrapeRedditUrl(url);
    case 'twitter':
      return scrapeTwitterUrl(url);
    case 'blog':
      return scrapeBlogUrl(url);
  }
}

// ---------- REDDIT ----------
async function scrapeRedditUrl(url: string): Promise<ScrapedContent> {
  // Normalize URL: remove trailing slash, add .json
  let jsonUrl = url.replace(/\/+$/, '');
  if (!jsonUrl.endsWith('.json')) jsonUrl += '.json';

  const res = await fetch(jsonUrl, {
    headers: { 'User-Agent': 'SHADOWFEED/1.0 (content-intelligence)' },
  });

  if (!res.ok) {
    throw new Error(`[URL-SCRAPER:REDDIT] HTTP ${res.status} fetching ${jsonUrl}`);
  }

  const data = await res.json();

  // Reddit returns an array: [0] = post listing, [1] = comments listing
  const postData = Array.isArray(data)
    ? data[0]?.data?.children?.[0]?.data
    : data?.data?.children?.[0]?.data;

  if (!postData) {
    throw new Error('[URL-SCRAPER:REDDIT] Could not parse Reddit JSON response');
  }

  const title = postData.title || 'Untitled';
  const selftext = postData.selftext || '';
  const author = postData.author || null;

  // If it's a link post (no selftext), use the linked URL domain as context
  let content = selftext;
  if (!content && postData.url && !postData.is_self) {
    content = `[Link post] ${postData.url}\n\n${postData.title}`;
  }

  logger.info(
    { title, contentLength: content.length, author },
    '[URL-SCRAPER:REDDIT] Scraped successfully'
  );

  return {
    title,
    content: content.slice(0, 4000),
    author,
    url,
    detectedType: 'reddit',
  };
}

// ---------- TWITTER/X ----------
async function scrapeTwitterUrl(url: string): Promise<ScrapedContent> {
  // Use Twitter oEmbed API (public, no auth required)
  const oembedUrl = `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&omit_script=true`;

  const res = await fetch(oembedUrl, {
    headers: { 'User-Agent': 'SHADOWFEED/1.0 (content-intelligence)' },
  });

  if (!res.ok) {
    throw new Error(`[URL-SCRAPER:TWITTER] oEmbed HTTP ${res.status} for ${url}`);
  }

  const data = await res.json() as {
    html: string;
    author_name: string;
    author_url: string;
  };

  // Extract tweet text from blockquote HTML
  // The HTML format is: <blockquote...><p>tweet text</p> ... </blockquote>
  const tweetText = extractTextFromHtml(data.html);
  const author = data.author_name || null;

  logger.info(
    { author, contentLength: tweetText.length },
    '[URL-SCRAPER:TWITTER] Scraped successfully'
  );

  return {
    title: tweetText.slice(0, 200),
    content: tweetText,
    author,
    url,
    detectedType: 'twitter',
  };
}

function extractTextFromHtml(html: string): string {
  // Extract content between <p> tags within the blockquote
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(html)) !== null) {
    // Strip all HTML tags from the paragraph content
    const text = match[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<a[^>]*>([\s\S]*?)<\/a>/gi, '$1')
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
    if (text) paragraphs.push(text);
  }

  // Filter out the date line (usually the last paragraph like "— Author (@handle) Date")
  const filtered = paragraphs.filter((p) => !p.startsWith('\u2014'));

  return filtered.join('\n\n') || paragraphs.join('\n\n');
}

// ---------- BLOG ----------
export async function scrapeBlogUrl(url: string): Promise<ScrapedContent> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait a bit for dynamic content
    await new Promise((r) => setTimeout(r, 2000));

    const result = await page.evaluate(() => {
      // Remove noise elements
      const removeSelectors = [
        'script', 'style', 'noscript', 'iframe', 'nav', 'footer',
        'aside', 'header', '.sidebar', '.nav', '.footer', '.header',
        '.menu', '.ad', '.ads', '.advertisement', '.cookie', '.popup',
        '.modal', '.social-share', '.comments', '#comments',
      ];
      removeSelectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => el.remove());
      });

      // Extract title
      const h1 = document.querySelector('h1');
      const title = h1?.innerText?.trim() || document.title || 'Untitled';

      // Find main content with priority
      const selectors = ['article', '[role="main"]', 'main', '.post-content', '.article-content', '.entry-content', '.content'];
      let contentEl: HTMLElement | null = null;

      for (const sel of selectors) {
        contentEl = document.querySelector(sel);
        if (contentEl && contentEl.innerText.trim().length > 100) break;
      }

      // Fallback: find the largest text block in body
      if (!contentEl || contentEl.innerText.trim().length < 100) {
        const divs = Array.from(document.querySelectorAll('div, section'));
        let maxLen = 0;
        for (const div of divs) {
          const text = (div as HTMLElement).innerText?.trim() || '';
          if (text.length > maxLen) {
            maxLen = text.length;
            contentEl = div as HTMLElement;
          }
        }
      }

      const content = contentEl?.innerText?.trim() || document.body?.innerText?.trim() || '';

      // Try to find author
      const authorMeta = document.querySelector('meta[name="author"]') as HTMLMetaElement | null;
      const author = authorMeta?.content || null;

      return { title, content, author };
    });

    logger.info(
      { title: result.title, contentLength: result.content.length },
      '[URL-SCRAPER:BLOG] Scraped successfully'
    );

    return {
      title: result.title,
      content: result.content.slice(0, 4000),
      author: result.author,
      url,
      detectedType: 'blog',
    };
  } finally {
    await browser.close();
  }
}
