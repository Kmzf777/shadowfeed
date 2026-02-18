// src/modules/forge-smart/smart-winner-scraper.ts

import { scrapeBlogUrl } from '../manual-news/url-scraper.js';
import { logger } from '../../config/logger.js';
import type { SmartCandidateScored } from './forge-smart.types.js';

export async function enrichWinnerWithScrapedBody(
  winner: SmartCandidateScored
): Promise<SmartCandidateScored> {
  // Twitter: thread stitching in Stage 2 already populated summary — no double-scraping
  if (winner.source_type === 'twitter') {
    logger.info({ winner: winner.title }, '[FORGE-SMART:SCRAPE] Twitter winner — using thread content');
    return winner;
  }

  // Google News: summary is ~80 chars — scrape the real URL
  if (!winner.url) {
    logger.warn({ winner: winner.title }, '[FORGE-SMART:SCRAPE] No URL to scrape — using summary fallback');
    return winner;
  }

  logger.info({ winner: winner.title, url: winner.url }, '[FORGE-SMART:SCRAPE] Scraping winner URL');

  try {
    const scraped = await scrapeBlogUrl(winner.url);

    if (scraped.content && scraped.content.length > 200) {
      logger.info(
        { contentLength: scraped.content.length, winner: winner.title },
        '[FORGE-SMART:SCRAPE] Scraped successfully'
      );
      return { ...winner, scraped_body: scraped.content };
    }

    logger.warn({ winner: winner.title }, '[FORGE-SMART:SCRAPE] Scraped but content too short — fallback');
    return winner;
  } catch (err) {
    logger.warn(
      { winner: winner.title, error: (err as Error).message },
      '[FORGE-SMART:SCRAPE] Scraping failed — using summary fallback'
    );
    return winner; // graceful fallback: never breaks the pipeline
  }
}
