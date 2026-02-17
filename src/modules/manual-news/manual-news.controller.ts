import { Router } from 'express';
import type { Request, Response } from 'express';
import { logger } from '../../config/logger.js';
import { generateFromUrl } from './manual-news.service.js';

const router = Router();

// POST /api/manual-news/generate
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { url, pipeline, userId } = req.body || {};

    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing or invalid "url" field' });
      return;
    }

    if (!pipeline || !['default', 'authority'].includes(pipeline)) {
      res.status(400).json({ error: 'Missing or invalid "pipeline" field. Must be "default" or "authority"' });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      res.status(400).json({ error: 'Invalid URL format' });
      return;
    }

    const post = await generateFromUrl(url, pipeline as 'default' | 'authority', userId);
    res.json(post);
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[MANUAL-NEWS] Generate endpoint failed');
    res.status(500).json({ error: 'Generation failed', message: (err as Error).message });
  }
});

export default router;
