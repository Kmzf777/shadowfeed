import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { scrapeGoogleNews } from './sources/news.source.js';
import { scrapeGoogleTrends } from './sources/trends.source.js';
import { scrapeReddit } from './sources/reddit.source.js';
// Lazy import — playwright-extra may not be installed
const loadTwitterSource = () => import('./sources/twitter.source.js');
import { scrapeGoogleTrendsEnriched } from './sources/trends-enriched.source.js';
import type { RawIntelItem, ReconResult, FullReconResult } from './recon.types.js';

async function saveIntelItems(items: RawIntelItem[]): Promise<number> {
  if (items.length === 0) return 0;

  const { data, error } = await supabase
    .from('sf_intel_sources')
    .insert(
      items.map((item) => ({
        source_type: item.source_type,
        title: item.title,
        summary: item.summary,
        url: item.url,
        author: item.author,
        category: item.category,
        source_score: item.source_score,
        source_comments: item.source_comments,
        relevance_score: item.relevance_score,
      }))
    )
    .select('id');

  if (error) {
    logger.error({ error: error.message }, '[RECON] Failed to save intel items');
    return 0;
  }

  return data?.length || 0;
}

export async function runNewsRecon(): Promise<ReconResult> {
  try {
    const items = await scrapeGoogleNews();
    const saved = await saveIntelItems(items);
    logger.info({ collected: items.length, saved }, '[RECON] News recon complete');
    return { source: 'google_news', collected: saved, errors: 0 };
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON] News recon failed');
    return { source: 'google_news', collected: 0, errors: 1 };
  }
}

export async function runTrendsRecon(): Promise<ReconResult> {
  try {
    const items = await scrapeGoogleTrends();
    const saved = await saveIntelItems(items);
    logger.info({ collected: items.length, saved }, '[RECON] Trends recon complete');
    return { source: 'google_trends', collected: saved, errors: 0 };
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON] Trends recon failed');
    return { source: 'google_trends', collected: 0, errors: 1 };
  }
}

export async function runRedditRecon(): Promise<ReconResult> {
  try {
    const items = await scrapeReddit();
    const saved = await saveIntelItems(items);
    logger.info({ collected: items.length, saved }, '[RECON] Reddit recon complete');
    return { source: 'reddit', collected: saved, errors: 0 };
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON] Reddit recon failed');
    return { source: 'reddit', collected: 0, errors: 1 };
  }
}

export async function runTwitterRecon(): Promise<ReconResult> {
  try {
    const { scrapeTwitter } = await loadTwitterSource();
    const items = await scrapeTwitter();
    const saved = await saveIntelItems(items);
    logger.info({ collected: items.length, saved }, '[RECON] Twitter recon complete');
    return { source: 'twitter', collected: saved, errors: 0 };
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON] Twitter recon failed');
    return { source: 'twitter', collected: 0, errors: 1 };
  }
}

export async function runTrendsEnrichedRecon(): Promise<ReconResult> {
  try {
    const items = await scrapeGoogleTrendsEnriched();
    const saved = await saveIntelItems(items);
    logger.info({ collected: items.length, saved }, '[RECON] Trends Enriched recon complete');
    return { source: 'google_trends_enriched', collected: saved, errors: 0 };
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON] Trends Enriched recon failed');
    return { source: 'google_trends_enriched', collected: 0, errors: 1 };
  }
}

export async function runFullRecon(): Promise<FullReconResult> {
  const startTime = Date.now();
  logger.info('[RECON] Full reconnaissance initiated');

  const results = await Promise.all([
    runNewsRecon(),
    runTrendsRecon(),
    runTrendsEnrichedRecon(),
    runRedditRecon(),
    runTwitterRecon(),
  ]);

  const total_collected = results.reduce((sum, r) => sum + r.collected, 0);
  const total_errors = results.reduce((sum, r) => sum + r.errors, 0);
  const duration_ms = Date.now() - startTime;

  logger.info(
    { total_collected, total_errors, duration_ms },
    '[RECON] Full reconnaissance complete'
  );

  return { results, total_collected, total_errors, duration_ms };
}
