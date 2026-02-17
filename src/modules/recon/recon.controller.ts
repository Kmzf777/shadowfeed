import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import {
  runFullRecon,
  runNewsRecon,
  runTrendsRecon,
  runTrendsEnrichedRecon,
  runRedditRecon,
  runTwitterRecon,
} from './recon.service.js';

const router = Router();

// POST /api/recon/run — Full RECON (all sources)
router.post('/run', async (_req: Request, res: Response) => {
  try {
    const result = await runFullRecon();
    res.json(result);
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON] Full recon endpoint failed');
    res.status(500).json({ error: 'Recon failed', message: (err as Error).message });
  }
});

// POST /api/recon/run/news
router.post('/run/news', async (_req: Request, res: Response) => {
  try {
    const result = await runNewsRecon();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'News recon failed', message: (err as Error).message });
  }
});

// POST /api/recon/run/trends
router.post('/run/trends', async (_req: Request, res: Response) => {
  try {
    const result = await runTrendsRecon();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Trends recon failed', message: (err as Error).message });
  }
});

// POST /api/recon/run/trends-enriched
router.post('/run/trends-enriched', async (_req: Request, res: Response) => {
  try {
    const result = await runTrendsEnrichedRecon();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Trends Enriched recon failed', message: (err as Error).message });
  }
});

// POST /api/recon/run/reddit
router.post('/run/reddit', async (_req: Request, res: Response) => {
  try {
    const result = await runRedditRecon();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Reddit recon failed', message: (err as Error).message });
  }
});

// POST /api/recon/run/twitter
router.post('/run/twitter', async (_req: Request, res: Response) => {
  try {
    const result = await runTwitterRecon();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Twitter recon failed', message: (err as Error).message });
  }
});

// GET /api/recon/intel — List intel sources
router.get('/intel', async (req: Request, res: Response) => {
  try {
    let query = supabase
      .from('sf_intel_sources')
      .select('*')
      .order('relevance_score', { ascending: false })
      .order('collected_at', { ascending: false })
      .limit(50);

    if (req.query.used !== undefined) {
      query = query.eq('used', req.query.used === 'true');
    }
    if (req.query.category) {
      query = query.eq('category', req.query.category as string);
    }
    if (req.query.source_type) {
      query = query.eq('source_type', req.query.source_type as string);
    }

    const { data, error } = await query;

    if (error) throw error;
    res.json({ count: data?.length || 0, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch intel', message: (err as Error).message });
  }
});

export default router;
