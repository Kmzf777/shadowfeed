import { Router } from 'express';
import type { Request, Response } from 'express';
import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { runReconUltra } from './recon-ultra.service.js';
import { validateBlogUrl } from './blog-url-validator.js';
import { suggestBlogsForNiche } from './blog-suggestion.service.js';
import type { ReconSourceType } from './recon-ultra.types.js';
import type { PillarId } from '../../shared/types/pillar.types.js';

const router = Router();

const MAX_BLOG_SOURCES = 10;

// ── POST /api/recon-ultra/run (AC11) ────────────────────────────
router.post('/run', async (req: Request, res: Response) => {
  try {
    const { userId, pillarId, sources } = req.body as {
      userId?: string;
      pillarId?: PillarId;
      sources?: ReconSourceType[];
    };

    if (!userId || !pillarId) {
      res.status(400).json({ error: 'Missing required fields: userId, pillarId' });
      return;
    }

    const validPillars: PillarId[] = ['educate', 'provoke', 'prove', 'connect', 'convert'];
    if (!validPillars.includes(pillarId)) {
      res.status(400).json({ error: `Invalid pillarId. Must be one of: ${validPillars.join(', ')}` });
      return;
    }

    const result = await runReconUltra({ userId, pillarId, sources });
    res.json(result);
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON-ULTRA] /run endpoint failed');
    res.status(500).json({ error: 'Recon Ultra pipeline failed', message: (err as Error).message });
  }
});

// ── GET /api/recon-ultra/intel (AC12) ───────────────────────────
router.get('/intel', async (req: Request, res: Response) => {
  try {
    const {
      pillar_tag,
      source_type,
      min_score,
      used,
      limit: limitParam,
      offset: offsetParam,
      user_id,
    } = req.query as Record<string, string | undefined>;

    const limit = Math.min(parseInt(limitParam ?? '50', 10) || 50, 100);
    const offset = parseInt(offsetParam ?? '0', 10) || 0;

    let query = supabase
      .from('sf_intel_sources_v2')
      .select('*', { count: 'exact' })
      .order('final_score', { ascending: false })
      .order('collected_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (pillar_tag) {
      query = query.eq('pillar_tag', pillar_tag);
    }
    if (source_type) {
      query = query.eq('source_type', source_type);
    }
    if (min_score) {
      query = query.gte('final_score', parseFloat(min_score));
    }
    if (used !== undefined) {
      query = query.eq('used', used === 'true');
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      data: data ?? [],
      count: data?.length ?? 0,
      total: count ?? 0,
      limit,
      offset,
    });
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON-ULTRA] /intel endpoint failed');
    res.status(500).json({ error: 'Failed to fetch intel', message: (err as Error).message });
  }
});

// ── GET /api/recon-ultra/intel/:pillarId (AC13) ─────────────────
router.get('/intel/:pillarId', async (req: Request, res: Response) => {
  try {
    const { pillarId } = req.params;
    const { user_id, min_score, used, limit: limitParam, offset: offsetParam } =
      req.query as Record<string, string | undefined>;

    const validPillars: PillarId[] = ['educate', 'provoke', 'prove', 'connect', 'convert'];
    if (!validPillars.includes(pillarId as PillarId)) {
      res.status(400).json({ error: `Invalid pillarId. Must be one of: ${validPillars.join(', ')}` });
      return;
    }

    const limit = Math.min(parseInt(limitParam ?? '50', 10) || 50, 100);
    const offset = parseInt(offsetParam ?? '0', 10) || 0;

    let query = supabase
      .from('sf_intel_sources_v2')
      .select('*', { count: 'exact' })
      .eq('pillar_tag', pillarId)
      .order('final_score', { ascending: false })
      .order('collected_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (min_score) {
      query = query.gte('final_score', parseFloat(min_score));
    }
    if (used !== undefined) {
      query = query.eq('used', used === 'true');
    }

    const { data, error, count } = await query;

    if (error) throw error;

    res.json({
      data: data ?? [],
      count: data?.length ?? 0,
      total: count ?? 0,
      limit,
      offset,
      pillarId,
    });
  } catch (err) {
    logger.error(
      { error: (err as Error).message, pillarId: req.params.pillarId },
      '[RECON-ULTRA] /intel/:pillarId endpoint failed'
    );
    res.status(500).json({ error: 'Failed to fetch intel', message: (err as Error).message });
  }
});

// ── POST /api/recon-ultra/blog-sources/suggest (AC1-AC8) ──────
router.post('/blog-sources/suggest', async (req: Request, res: Response) => {
  try {
    const { userId } = req.body as { userId?: string };

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Fetch user profile to get niche
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('niche, target_audience')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ error: 'User profile not found' });
      return;
    }

    if (!profile.niche) {
      res.status(400).json({ error: 'User must have niche set for blog suggestions' });
      return;
    }

    const suggestions = await suggestBlogsForNiche(
      profile.niche,
      profile.target_audience,
      userId
    );

    res.json({ suggestions });
  } catch (err) {
    logger.error(
      { error: (err as Error).message },
      '[RECON-ULTRA] /blog-sources/suggest failed'
    );
    // AC7: Gemini error → empty suggestions with warning
    res.json({ suggestions: [], warning: 'Could not generate suggestions at this time' });
  }
});

// ── POST /api/recon-ultra/blog-sources ────────────────────────
router.post('/blog-sources', async (req: Request, res: Response) => {
  try {
    const { userId, blog_url, blog_name, scrape_frequency } = req.body as {
      userId?: string;
      blog_url?: string;
      blog_name?: string;
      scrape_frequency?: 'hourly' | 'daily' | 'weekly';
    };

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }
    if (!blog_url) {
      res.status(400).json({ error: 'blog_url is required' });
      return;
    }

    // Validate scrape_frequency if provided
    if (scrape_frequency && !['hourly', 'daily', 'weekly'].includes(scrape_frequency)) {
      res.status(400).json({ error: 'scrape_frequency must be hourly, daily, or weekly' });
      return;
    }

    // URL validation (HTTPS, no social media, no SSRF)
    const validation = await validateBlogUrl(blog_url);
    if (!validation.valid) {
      res.status(400).json({ error: validation.reason });
      return;
    }

    // Max 10 enforcement
    const { count, error: countError } = await supabase
      .from('sf_user_blog_sources')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    if ((count ?? 0) >= MAX_BLOG_SOURCES) {
      res.status(400).json({ error: `Maximum ${MAX_BLOG_SOURCES} blog sources allowed per user` });
      return;
    }

    // Insert
    const { data, error } = await supabase
      .from('sf_user_blog_sources')
      .insert({
        user_id: userId,
        blog_url,
        blog_name: blog_name ?? null,
        scrape_frequency: scrape_frequency ?? 'daily',
      })
      .select()
      .single();

    if (error) {
      // Duplicate check (unique constraint violation)
      if (error.code === '23505') {
        res.status(409).json({ error: 'This blog URL already exists for your account' });
        return;
      }
      throw error;
    }

    res.status(201).json({ data, warning: validation.warning });
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON-ULTRA] POST /blog-sources failed');
    res.status(500).json({ error: 'Failed to add blog source', message: (err as Error).message });
  }
});

// ── GET /api/recon-ultra/blog-sources ─────────────────────────
router.get('/blog-sources', async (req: Request, res: Response) => {
  try {
    const { user_id } = req.query as { user_id?: string };

    if (!user_id) {
      res.status(400).json({ error: 'user_id query parameter is required' });
      return;
    }

    const { data, error } = await supabase
      .from('sf_user_blog_sources')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ data: data ?? [] });
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON-ULTRA] GET /blog-sources failed');
    res.status(500).json({ error: 'Failed to list blog sources', message: (err as Error).message });
  }
});

// ── DELETE /api/recon-ultra/blog-sources/:id ──────────────────
router.delete('/blog-sources/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id } = req.query as { user_id?: string };

    if (!user_id) {
      res.status(400).json({ error: 'user_id query parameter is required' });
      return;
    }

    const { data, error } = await supabase
      .from('sf_user_blog_sources')
      .delete()
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Blog source not found or not owned by user' });
        return;
      }
      throw error;
    }

    res.json({ data, message: 'Blog source deleted' });
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON-ULTRA] DELETE /blog-sources/:id failed');
    res.status(500).json({ error: 'Failed to delete blog source', message: (err as Error).message });
  }
});

// ── PATCH /api/recon-ultra/blog-sources/:id ───────────────────
router.patch('/blog-sources/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, is_active } = req.body as { user_id?: string; is_active?: boolean };

    if (!user_id) {
      res.status(400).json({ error: 'user_id is required' });
      return;
    }
    if (typeof is_active !== 'boolean') {
      res.status(400).json({ error: 'is_active (boolean) is required' });
      return;
    }

    const { data, error } = await supabase
      .from('sf_user_blog_sources')
      .update({ is_active })
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: 'Blog source not found or not owned by user' });
        return;
      }
      throw error;
    }

    res.json({ data });
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[RECON-ULTRA] PATCH /blog-sources/:id failed');
    res.status(500).json({ error: 'Failed to update blog source', message: (err as Error).message });
  }
});

export default router;
