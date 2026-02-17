import { Router } from 'express';
import type { Request, Response } from 'express';
import { logger } from '../../config/logger.js';
import { forgeAuthorityCarousel } from './forge-authority.service.js';

const router = Router();

// POST /api/forge-authority/generate — Generate a tweet-thread carousel
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { source_id, theme } = req.body || {};
    const post = await forgeAuthorityCarousel(source_id, theme);
    res.json(post);
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[FORGE-AUTHORITY] Generate failed');
    res.status(500).json({ error: 'Generation failed', message: (err as Error).message });
  }
});

// POST /api/forge-authority/batch — Generate N tweet-thread carousels
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const count = Math.min(req.body?.count || 1, 5);
    const posts = [];

    for (let i = 0; i < count; i++) {
      try {
        const post = await forgeAuthorityCarousel();
        posts.push(post);
      } catch (err) {
        logger.error(
          { batch: i + 1, error: (err as Error).message },
          '[FORGE-AUTHORITY] Batch item failed'
        );
      }
    }

    res.json({ requested: count, generated: posts.length, posts });
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[FORGE-AUTHORITY] Batch failed');
    res.status(500).json({ error: 'Batch failed', message: (err as Error).message });
  }
});

export default router;
