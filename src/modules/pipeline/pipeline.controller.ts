import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { runPipeline, getLastPipelineStatus } from './pipeline.service.js';
import { cleanupPostOutput } from '../../shared/utils/file-manager.js';

const router = Router();

// ══════════════════════════════════════
// PIPELINE ENDPOINTS
// ══════════════════════════════════════

// POST /api/pipeline/run — Full pipeline: RECON → FORGE → RENDER
router.post('/pipeline/run', async (_req: Request, res: Response) => {
  try {
    const result = await runPipeline();
    res.json(result);
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[PIPELINE] Run endpoint failed');
    res.status(500).json({ error: 'Pipeline failed', message: (err as Error).message });
  }
});

// GET /api/pipeline/status — Last pipeline run status
router.get('/pipeline/status', (_req: Request, res: Response) => {
  const status = getLastPipelineStatus();
  if (!status) {
    res.json({ message: 'No pipeline has been executed yet' });
    return;
  }
  res.json(status);
});

// ══════════════════════════════════════
// POSTS MANAGEMENT ENDPOINTS
// ══════════════════════════════════════

// GET /api/posts — List posts with filters
router.get('/posts', async (req: Request, res: Response) => {
  try {
    let query = supabase
      .from('sf_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);

    if (req.query.status) {
      query = query.eq('status', req.query.status as string);
    }
    if (req.query.style) {
      query = query.eq('style', req.query.style as string);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ count: data?.length || 0, data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch posts', message: (err as Error).message });
  }
});

// GET /api/posts/:id — Single post details
router.get('/posts/:id', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('sf_posts')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch post', message: (err as Error).message });
  }
});

// PATCH /api/posts/:id/approve
router.patch('/posts/:id/approve', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('sf_posts')
      .update({ status: 'approved' })
      .eq('id', req.params.id)
      .eq('status', 'rendered')
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      res.status(400).json({ error: 'Post not found or not in "rendered" status' });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Approve failed', message: (err as Error).message });
  }
});

// PATCH /api/posts/:id/reject
router.patch('/posts/:id/reject', async (req: Request, res: Response) => {
  try {
    const reason = req.body?.reason || null;
    const { data, error } = await supabase
      .from('sf_posts')
      .update({ status: 'rejected', rejection_reason: reason })
      .eq('id', req.params.id)
      .in('status', ['rendered', 'draft'])
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      res.status(400).json({ error: 'Post not found or cannot be rejected' });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Reject failed', message: (err as Error).message });
  }
});

// PATCH /api/posts/:id/publish
router.patch('/posts/:id/publish', async (req: Request, res: Response) => {
  try {
    const { ig_post_id, ig_post_url } = req.body || {};
    const { data, error } = await supabase
      .from('sf_posts')
      .update({
        status: 'published',
        ig_post_id: ig_post_id || null,
        ig_post_url: ig_post_url || null,
        published_at: new Date().toISOString(),
      })
      .eq('id', req.params.id)
      .in('status', ['approved', 'rendered'])
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      res.status(400).json({ error: 'Post not found or not in "approved"/"rendered" status' });
      return;
    }
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Publish failed', message: (err as Error).message });
  }
});

// DELETE /api/posts/:id — Remove post and associated PNGs
router.delete('/posts/:id', async (req: Request, res: Response) => {
  try {
    // Get post first to find rendered paths
    const { data: post } = await supabase
      .from('sf_posts')
      .select('id, rendered_paths')
      .eq('id', req.params.id)
      .single();

    if (!post) {
      res.status(404).json({ error: 'Post not found' });
      return;
    }

    // Clean up output files
    const postId = req.params.id as string;
    await cleanupPostOutput(postId);

    // Delete from DB
    const { error } = await supabase.from('sf_posts').delete().eq('id', postId);

    if (error) throw error;
    res.json({ message: 'Post deleted', id: postId });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', message: (err as Error).message });
  }
});

export default router;
