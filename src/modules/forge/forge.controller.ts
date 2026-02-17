import { Router } from 'express';
import type { Request, Response } from 'express';
import { logger } from '../../config/logger.js';
import { forgeCarousel } from './forge.service.js';

const router = Router();

// POST /api/forge/generate — Generate a carousel
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { source_id, theme } = req.body || {};
    const post = await forgeCarousel(source_id, theme);
    res.json(post);
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[FORGE] Generate endpoint failed');
    res.status(500).json({ error: 'Generation failed', message: (err as Error).message });
  }
});

// POST /api/forge/batch — Generate N carousels
router.post('/batch', async (req: Request, res: Response) => {
  try {
    const count = Math.min(req.body?.count || 1, 5); // Max 5 per batch
    const posts = [];

    for (let i = 0; i < count; i++) {
      try {
        const post = await forgeCarousel();
        posts.push(post);
      } catch (err) {
        logger.error(
          { batch: i + 1, error: (err as Error).message },
          '[FORGE] Batch item failed'
        );
      }
    }

    res.json({ requested: count, generated: posts.length, posts });
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[FORGE] Batch endpoint failed');
    res.status(500).json({ error: 'Batch generation failed', message: (err as Error).message });
  }
});

// POST /api/forge/regenerate/:id — Regenerate a rejected post
router.post('/regenerate/:id', async (req: Request, res: Response) => {
  try {
    const { supabase } = await import('../../config/supabase.js');
    const { data: oldPost, error } = await supabase
      .from('sf_posts')
      .select('intel_source_id, theme')
      .eq('id', req.params.id)
      .single();

    if (error || !oldPost) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    const post = await forgeCarousel(
      oldPost.intel_source_id || undefined,
      oldPost.intel_source_id ? undefined : oldPost.theme
    );

    res.json(post);
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[FORGE] Regenerate endpoint failed');
    res.status(500).json({ error: 'Regeneration failed', message: (err as Error).message });
  }
});

export default router;
