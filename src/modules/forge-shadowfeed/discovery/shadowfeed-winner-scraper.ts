// src/modules/forge-shadowfeed/discovery/shadowfeed-winner-scraper.ts

import { scrapeBlogUrl } from '../../manual-news/url-scraper.js';
import { logger } from '../../../config/logger.js';
import type { SmartCandidateScored } from '../../forge-smart/forge-smart.types.js';

export interface ScrapeResult {
  scrapedBody: string;
  charCount: number;
  source: string;
}

/**
 * Scrape the winner article's full body text.
 *
 * Source-specific handling:
 * - Google News / Blogs: Puppeteer via scrapeBlogUrl() → extract <article> or <main> → 4000 chars max
 * - Twitter: use thread content already fetched (skip scrape)
 * - Reddit: use .json API for full selftext
 *
 * Returns null on failure — NEVER breaks the pipeline.
 */
export async function scrapeWinnerBody(
  winner: SmartCandidateScored,
): Promise<ScrapeResult | null> {
  // Twitter: thread content already populated in summary — no double-scraping
  if (winner.source_type === 'twitter') {
    const content = winner.summary || winner.title;
    if (content && content.length > 50) {
      logger.info(
        { winner: winner.title },
        '[SHADOWFEED:SCRAPE] Twitter winner — using existing thread content',
      );
      return {
        scrapedBody: content.slice(0, 4000),
        charCount: Math.min(content.length, 4000),
        source: 'twitter-thread',
      };
    }
    return null;
  }

  // Reddit: use .json API for full selftext
  if (winner.source_type === 'reddit' && winner.url) {
    try {
      const jsonUrl = winner.url.replace(/\/+$/, '') + '.json';
      const res = await fetch(jsonUrl, {
        headers: { 'User-Agent': 'SHADOWFEED/1.0 (content-intelligence)' },
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        const data = await res.json();
        const postData = Array.isArray(data)
          ? data[0]?.data?.children?.[0]?.data
          : data?.data?.children?.[0]?.data;

        const selftext = postData?.selftext as string | undefined;
        if (selftext && selftext.length > 50) {
          logger.info(
            { winner: winner.title, charCount: selftext.length },
            '[SHADOWFEED:SCRAPE] Reddit winner — selftext extracted',
          );
          return {
            scrapedBody: selftext.slice(0, 4000),
            charCount: Math.min(selftext.length, 4000),
            source: 'reddit-json',
          };
        }
      }
    } catch (err) {
      logger.warn(
        { winner: winner.title, error: (err as Error).message },
        '[SHADOWFEED:SCRAPE] Reddit JSON fetch failed — trying blog scraper fallback',
      );
    }
  }

  // Google News / Blogs: Puppeteer scrape via scrapeBlogUrl()
  if (!winner.url) {
    logger.warn(
      { winner: winner.title },
      '[SHADOWFEED:SCRAPE] No URL to scrape — returning null',
    );
    return null;
  }

  try {
    const scraped = await scrapeBlogUrl(winner.url);

    if (scraped.content && scraped.content.length > 100) {
      logger.info(
        { winner: winner.title, charCount: scraped.content.length },
        '[SHADOWFEED:SCRAPE] Blog/News winner — scraped successfully',
      );
      return {
        scrapedBody: scraped.content.slice(0, 4000),
        charCount: Math.min(scraped.content.length, 4000),
        source: 'puppeteer-blog',
      };
    }

    logger.warn(
      { winner: winner.title, charCount: scraped.content.length },
      '[SHADOWFEED:SCRAPE] Scraped but content too short — returning null',
    );
    return null;
  } catch (err) {
    logger.warn(
      { winner: winner.title, error: (err as Error).message },
      '[SHADOWFEED:SCRAPE] Scraping failed — returning null (graceful fallback)',
    );
    return null;
  }
}
