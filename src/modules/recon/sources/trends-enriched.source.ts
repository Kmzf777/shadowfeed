import puppeteer from 'puppeteer';
import { logger } from '../../../config/logger.js';
import type { RawIntelItem } from '../recon.types.js';

/* ── Internal types ───────────────────────────────────── */

interface TrendItem {
  title: string;
  traffic: string | null;
  trafficValue: number | null;
  category: 'technology' | 'business';
  newsItems: NewsItem[];
}

interface NewsItem {
  headline: string;
  subtitle: string | null;
  firstParagraph: string | null;
}

/* ── Config ───────────────────────────────────────────── */

const CATEGORIES: Record<string, { id: string; display: string }> = {
  technology: { id: '18', display: 'Technology (Sci/Tech)' },
  business: { id: '3', display: 'Business & Finance' },
};

const MAX_TRENDS_PER_CATEGORY = 3;
const MAX_NEWS_PER_TREND = 3;

const SKIP_PATTERNS = [
  /^trends$/i, /^home$/i, /^explore$/i, /^trending/i, /^sign in$/i,
  /^location_on$/i, /^calendar_month$/i, /^category$/i, /^grid_3x3$/i,
  /^sort$/i, /^search$/i, /^info$/i, /^arrow_drop_down$/i,
  /^last\s*\d+\s*(hours?|days?)$/i, /^past\s*\d+\s*(hours?|days?)$/i,
  /^\d+\s*(hours?|days?)\s*ago$/i, /^updated\s/i, /^all\s*categories$/i,
  /^science\s*\/\s*tech/i, /^business/i, /^\d{1,2}[:/]\d{2}/,
  /^\d+$/, /^(mon|tue|wed|thu|fri|sat|sun)/i, /^google\s*trends/i,
  /cookie/i, /privacy/i, /terms/i, /^help$/i, /^feedback$/i,
  /^all\s*trends$/i, /^by\s*relevance$/i, /^search\s*volume$/i,
  /^active$/i, /^select\s*location$/i, /^\+\s*\d+\s*more$/i,
  /^daily$/i, /^realtime$/i, /^now$/i, /^today$/i,
];

const TRAFFIC_PATTERN = /^(\d+[\d,.]*)\s*(K|M|B)?\+?\s*(searches)?$/i;

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/* ── Main export ──────────────────────────────────────── */

export async function scrapeGoogleTrendsEnriched(): Promise<RawIntelItem[]> {
  logger.info('[RECON:TRENDS-ENRICHED] Starting Puppeteer trends scraping');

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled',
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });
    await page.setViewport({ width: 1920, height: 1080 });

    const allTrends: TrendItem[] = [];

    // Scrape both categories
    for (const [catKey, catInfo] of Object.entries(CATEGORIES)) {
      const url = `https://trends.google.com.br/trending?geo=BR&hl=en-US&hours=24&category=${catInfo.id}`;
      logger.info({ category: catKey, url }, '[RECON:TRENDS-ENRICHED] Navigating to trends page');

      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30_000 });
        await delay(3000);

        const bodyText = await page.evaluate(() => document.body.innerText);
        const trends = extractTrendsFromText(bodyText, catKey as 'technology' | 'business');

        logger.info(
          { category: catKey, found: trends.length },
          '[RECON:TRENDS-ENRICHED] Trends extracted from page'
        );

        allTrends.push(...trends);
      } catch (err) {
        logger.error(
          { category: catKey, error: (err as Error).message },
          '[RECON:TRENDS-ENRICHED] Failed to scrape category'
        );
      }
    }

    // Enrich each trend with news from Google Search
    for (const trend of allTrends) {
      try {
        trend.newsItems = await enrichWithNews(page, trend.title);
        logger.info(
          { trend: trend.title, newsCount: trend.newsItems.length },
          '[RECON:TRENDS-ENRICHED] News enrichment complete'
        );
      } catch (err) {
        logger.error(
          { trend: trend.title, error: (err as Error).message },
          '[RECON:TRENDS-ENRICHED] News enrichment failed'
        );
        trend.newsItems = [];
      }
      await delay(2000);
    }

    // Convert to RawIntelItem[]
    const items = allTrends.map((trend) => trendToIntelItem(trend));

    // Deduplicate
    const seen = new Set<string>();
    const deduplicated = items.filter((item) => {
      const key = item.title.toLowerCase().slice(0, 60);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    logger.info({ total: deduplicated.length }, '[RECON:TRENDS-ENRICHED] Collection complete');
    return deduplicated;
  } finally {
    await browser.close();
  }
}

/* ── Text parsing ─────────────────────────────────────── */

function extractTrendsFromText(text: string, category: 'technology' | 'business'): TrendItem[] {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const trends: TrendItem[] = [];

  for (let i = 0; i < lines.length && trends.length < MAX_TRENDS_PER_CATEGORY; i++) {
    const line = lines[i];

    // Skip UI/navigation lines
    if (SKIP_PATTERNS.some((pat) => pat.test(line))) continue;
    if (line.length < 3 || line.length > 120) continue;

    // Check if the NEXT line is a traffic volume
    const nextLine = lines[i + 1]?.trim() || '';
    const trafficMatch = TRAFFIC_PATTERN.exec(nextLine);

    if (trafficMatch) {
      trends.push({
        title: line,
        traffic: nextLine.replace(/\s*searches?\s*$/i, '').trim(),
        trafficValue: parseTrafficValue(nextLine),
        category,
        newsItems: [],
      });
      i++; // Skip the traffic line
    }
  }

  return trends;
}

function parseTrafficValue(text: string): number | null {
  const match = TRAFFIC_PATTERN.exec(text);
  if (!match) return null;

  let value = parseFloat(match[1].replace(/,/g, ''));
  const multiplier = (match[2] || '').toUpperCase();

  if (multiplier === 'K') value *= 1_000;
  else if (multiplier === 'M') value *= 1_000_000;
  else if (multiplier === 'B') value *= 1_000_000_000;

  return value;
}

/* ── News enrichment ──────────────────────────────────── */

async function enrichWithNews(page: puppeteer.Page, trendTitle: string): Promise<NewsItem[]> {
  // Strategy 1: Google News tab (most reliable for news results)
  const newsUrl = `https://www.google.com/search?q=${encodeURIComponent(trendTitle)}&tbm=nws&hl=pt-BR`;

  try {
    await page.goto(newsUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await delay(2500);

    // Handle possible consent page
    try {
      const consentBtn = await page.$('button[id="L2AGLb"], form[action*="consent"] button');
      if (consentBtn) {
        await consentBtn.click();
        await delay(2000);
      }
    } catch { /* consent page not present, continue */ }

    const newsItems = await page.evaluate((maxItems: number) => {
      const items: Array<{ headline: string; subtitle: string | null; firstParagraph: string | null }> = [];

      // Multiple selector strategies for Google News results
      const selectorSets = [
        '#search .g',
        '#rso > div',
        '.SoaBEf',
        '.WlydOe',
        'div[data-hveid]',
      ];

      for (const selector of selectorSets) {
        if (items.length >= maxItems) break;
        const divs = document.querySelectorAll(selector);
        if (divs.length === 0) continue;

        for (let i = 0; i < Math.min(divs.length, maxItems * 2); i++) {
          if (items.length >= maxItems) break;
          const div = divs[i];

          const h3 = div.querySelector('h3') || div.querySelector('[role="heading"]');
          const headline = h3?.textContent?.trim() || '';
          if (!headline || headline.length < 10) continue;

          const cite = div.querySelector('cite');
          const srcEl = div.querySelector('.NUnG9d') || div.querySelector('[data-snf]');
          const subtitle = cite?.textContent?.trim() || srcEl?.textContent?.trim() || null;

          let firstParagraph: string | null = null;
          const textEls = div.querySelectorAll('span, div[class]');
          for (const el of textEls) {
            const text = el.textContent?.trim() || '';
            if (text.length > 40 && text !== headline && text !== (subtitle || '')) {
              firstParagraph = text.slice(0, 500);
              break;
            }
          }

          if (items.some((it) => it.headline === headline)) continue;
          items.push({ headline, subtitle, firstParagraph });
        }
      }

      // Fallback: extract directly from all h3 elements on page
      if (items.length === 0) {
        const allH3s = document.querySelectorAll('h3');
        for (const h3 of allH3s) {
          if (items.length >= maxItems) break;
          const headline = h3.textContent?.trim() || '';
          if (headline.length < 10) continue;

          const parent = h3.closest('div[class]') || h3.parentElement;
          let firstParagraph: string | null = null;
          if (parent) {
            const full = parent.textContent?.trim() || '';
            const desc = full.replace(headline, '').trim().slice(0, 500);
            if (desc.length > 30) firstParagraph = desc;
          }

          if (items.some((it) => it.headline === headline)) continue;
          items.push({ headline, subtitle: null, firstParagraph });
        }
      }

      return items;
    }, MAX_NEWS_PER_TREND);

    if (newsItems.length > 0) return newsItems;
  } catch (err) {
    logger.warn(
      { trend: trendTitle, error: (err as Error).message },
      '[RECON:TRENDS-ENRICHED] Google News tab failed, trying regular search'
    );
  }

  // Strategy 2: Fallback to regular Google Search
  const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(trendTitle + ' notícia')}&hl=pt-BR`;

  try {
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20_000 });
    await delay(2500);

    const fallbackItems = await page.evaluate((maxItems: number) => {
      const items: Array<{ headline: string; subtitle: string | null; firstParagraph: string | null }> = [];
      const allH3s = document.querySelectorAll('h3');

      for (const h3 of allH3s) {
        if (items.length >= maxItems) break;
        const headline = h3.textContent?.trim() || '';
        if (headline.length < 10) continue;

        const container = h3.closest('[data-hveid]') || h3.closest('.g') || h3.parentElement?.parentElement;
        let subtitle: string | null = null;
        let firstParagraph: string | null = null;

        if (container) {
          const cite = container.querySelector('cite');
          subtitle = cite?.textContent?.trim() || null;

          const spans = container.querySelectorAll('span, em');
          for (const span of spans) {
            const text = span.textContent?.trim() || '';
            if (text.length > 40 && text !== headline) {
              firstParagraph = text.slice(0, 500);
              break;
            }
          }
        }

        items.push({ headline, subtitle, firstParagraph });
      }

      return items;
    }, MAX_NEWS_PER_TREND);

    return fallbackItems;
  } catch (err) {
    logger.warn(
      { trend: trendTitle, error: (err as Error).message },
      '[RECON:TRENDS-ENRICHED] Fallback search also failed'
    );
    return [];
  }
}

/* ── Conversion ───────────────────────────────────────── */

function trendToIntelItem(trend: TrendItem): RawIntelItem {
  const newsText = formatNewsForSummary(trend.newsItems);

  const summary = [
    `Trend: ${trend.title}`,
    `Traffic: ${trend.traffic || 'N/A'}`,
    `Category: ${trend.category}`,
    '',
    newsText || 'No news articles found.',
  ].join('\n');

  return {
    source_type: 'google_trends_enriched',
    title: trend.title,
    summary,
    url: `https://trends.google.com.br/trending?geo=BR&hl=en-US&hours=24`,
    author: null,
    category: categorizeTrend(trend.title),
    source_score: trend.trafficValue,
    source_comments: null,
    source_retweets: null,
    source_replies: null,
    source_views: null,
    posted_at: null,
    relevance_score: scoreTrendRelevance(trend),
  };
}

function formatNewsForSummary(newsItems: NewsItem[]): string {
  if (newsItems.length === 0) return '';

  return newsItems
    .map((item, i) => {
      let text = `ARTIGO ${i + 1}:\n`;
      text += `  Headline: ${item.headline}\n`;
      if (item.subtitle) text += `  Fonte: ${item.subtitle}\n`;
      if (item.firstParagraph) text += `  Resumo: ${item.firstParagraph}\n`;
      return text;
    })
    .join('\n');
}

function categorizeTrend(title: string): RawIntelItem['category'] {
  const lower = title.toLowerCase();
  if (/model|gpt|claude|gemini|llama|deepseek|mistral|openai|anthropic/i.test(lower)) return 'ai_models';
  if (/tool|app|product|saas|platform/i.test(lower)) return 'ai_tools';
  if (/automat|workflow|no.?code|low.?code/i.test(lower)) return 'automation';
  if (/code|dev|program|api|sdk/i.test(lower)) return 'coding';
  if (/acqui|merger|ipo|funding|revenue|layoff/i.test(lower)) return 'industry_news';
  return 'industry_news';
}

function scoreTrendRelevance(trend: TrendItem): number {
  let score = 5.0;

  // Traffic volume bonus
  if (trend.trafficValue) {
    if (trend.trafficValue >= 500_000) score += 3;
    else if (trend.trafficValue >= 100_000) score += 2;
    else if (trend.trafficValue >= 10_000) score += 1;
  }

  // AI/Tech relevance bonus
  if (/ai|ia|intelig|artificial|machine.?learn|deep.?learn|neural|llm/i.test(trend.title)) {
    score += 1.5;
  }

  // News enrichment bonus
  if (trend.newsItems.length >= 2) score += 0.5;

  return Math.min(score, 10);
}

/* ── Helpers ──────────────────────────────────────────── */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
