import { Router } from 'express';
import type { Request, Response } from 'express';
import { createReadStream } from 'fs';
import { join } from 'path';
import archiver from 'archiver';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { renderPost } from './render.service.js';

const router = Router();

// POST /api/render/:postId — Render PNGs for a post
router.post('/:postId', async (req: Request, res: Response) => {
  try {
    const postId = req.params.postId as string;
    const result = await renderPost(postId);
    res.json(result);
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RENDER] Render endpoint failed');
    res.status(500).json({ error: 'Render failed', message: (err as Error).message });
  }
});

// GET /api/render/:postId/download — Download ZIP with all PNGs
router.get('/:postId/download', async (req: Request, res: Response) => {
  try {
    const { data: post, error } = await supabase
      .from('sf_posts')
      .select('rendered_paths, theme')
      .eq('id', req.params.postId)
      .single();

    if (error || !post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    if (!post.rendered_paths || post.rendered_paths.length === 0) {
      res.status(400).json({ error: 'Post has not been rendered yet' });
      return;
    }

    const safeName = (post.theme as string)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 30);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}-slides.zip"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const filePath of post.rendered_paths as string[]) {
      const filename = filePath.split(/[\\/]/).pop() || 'slide.png';
      archive.append(createReadStream(filePath), { name: filename });
    }

    // Also add metadata.json if it exists
    const metadataPath = join(
      (post.rendered_paths as string[])[0].replace(/[\\/][^\\/]+$/, ''),
      'metadata.json'
    );
    try {
      archive.append(createReadStream(metadataPath), { name: 'metadata.json' });
    } catch {
      // metadata.json might not exist
    }

    await archive.finalize();
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RENDER] Download endpoint failed');
    res.status(500).json({ error: 'Download failed', message: (err as Error).message });
  }
});

export default router;
