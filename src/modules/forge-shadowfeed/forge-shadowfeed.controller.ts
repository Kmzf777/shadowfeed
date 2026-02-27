import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { forgeShadowFeedService } from './forge-shadowfeed.service.js';
import { PILLARS } from './forge-shadowfeed.types.js';
import type { PillarId } from './forge-shadowfeed.types.js';
import { instagramSessionManager } from '../shadowfeed-publisher/instagram-session.manager.js';
import { instagramPoster, type SlideFile } from '../shadowfeed-publisher/instagram-poster.js';
import { shadowFeedScheduler } from './shadowfeed-scheduler.js';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const forgeShadowFeedController = Router();

function errMsg(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

function adminTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-sf-admin-token'] || req.query['token'];

  if (!token || token !== env.SHADOWFEED_ADMIN_TOKEN) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  next();
}

/**
 * AC5 — Publish-check webhook protection.
 * Accepts: x-sf-admin-token header, ?token= query param, or Authorization: Bearer {token}.
 * The Bearer format allows Vercel Cron Jobs (set CRON_SECRET = SHADOWFEED_ADMIN_TOKEN in Vercel).
 * pg_cron: include token in the webhook URL as ?token=...
 */
function publishCheckMiddleware(req: Request, res: Response, next: NextFunction): void {
  const adminToken = env.SHADOWFEED_ADMIN_TOKEN;

  const headerToken = req.headers['x-sf-admin-token'];
  const queryToken = req.query['token'];
  const authHeader = req.headers['authorization'];
  const bearerToken =
    typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : undefined;

  const provided = headerToken ?? queryToken ?? bearerToken;

  if (!provided || provided !== adminToken) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  next();
}

// AC4 — POST /api/forge-shadowfeed/publish-check
// Registered BEFORE global adminTokenMiddleware so it can use its own auth (bearer + query param).
forgeShadowFeedController.post('/publish-check', publishCheckMiddleware, async (_req, res) => {
  try {
    const result = await shadowFeedScheduler.checkAndPublish();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

forgeShadowFeedController.use(adminTokenMiddleware);

// Generation
forgeShadowFeedController.post('/generate-batch', async (req, res) => {
  try {
    const pillarId = req.body?.pillarId as string | undefined;

    // Validate pillarId if provided (non-empty string)
    if (pillarId !== undefined && pillarId !== '') {
      const validIds = PILLARS.map((p) => p.id);
      if (!validIds.includes(pillarId as PillarId)) {
        return res.status(400).json({
          error: `Invalid pillarId: ${pillarId}. Valid: ${validIds.join(', ')}`,
        });
      }
    }

    const validatedPillarId = pillarId && pillarId !== '' ? (pillarId as PillarId) : undefined;
    const result = await forgeShadowFeedService.generateBatch(validatedPillarId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

forgeShadowFeedController.post('/generate/:pillarId', async (req, res) => {
  try {
    const result = await forgeShadowFeedService.generatePillar(req.params.pillarId as PillarId);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

// Queue and approval
forgeShadowFeedController.get('/queue/recent', async (_req, res) => {
  try {
    const result = await forgeShadowFeedService.getRecentPosts();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

forgeShadowFeedController.get('/queue', async (req, res) => {
  try {
    const result = await forgeShadowFeedService.getQueue(req.query['date'] as string | undefined);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

forgeShadowFeedController.put('/queue/:id/approve', async (req, res) => {
  try {
    const result = await forgeShadowFeedService.approvePost(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

forgeShadowFeedController.put('/queue/:id/caption', async (req, res) => {
  try {
    const { caption } = req.body as { caption: string };
    const result = await forgeShadowFeedService.updateCaption(req.params.id, caption);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

forgeShadowFeedController.post('/queue/:id/publish-now', async (req, res) => {
  try {
    const result = await forgeShadowFeedService.publishNow(req.params.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

forgeShadowFeedController.post('/post-manual/:postId', upload.array('files'), async (req, res) => {
  let context = null;
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided for manual upload.' });
    }

    const caption = req.body.caption || '';

    // Check session early
    const isValid = await instagramSessionManager.isSessionValid();
    if (!isValid) {
      return res.status(401).json({ error: 'Instagram session invalid or expired.' });
    }

    const slideFiles: SlideFile[] = files.map((f, i) => ({
      name: f.originalname || `slide-${i + 1}.png`,
      mimeType: f.mimetype,
      buffer: f.buffer
    }));

    context = await instagramSessionManager.loadSession();
    await instagramPoster.post(context, slideFiles, caption);

    return res.json({ success: true, message: 'Posted to Instagram successfully.' });
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  } finally {
    if (context) {
      context.browser()?.close().catch(() => undefined);
    }
  }
});

// Config
forgeShadowFeedController.get('/config', async (_req, res) => {
  try {
    const result = await forgeShadowFeedService.getConfig();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

forgeShadowFeedController.put('/config', async (req, res) => {
  try {
    const result = await forgeShadowFeedService.updateConfig(req.body);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

// Instagram session
forgeShadowFeedController.get('/session/status', async (_req, res) => {
  try {
    const status = await instagramSessionManager.getStatus();
    return res.json(status);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

forgeShadowFeedController.post('/session/refresh', async (_req, res) => {
  try {
    const isValid = await instagramSessionManager.isSessionValid();
    const status = await instagramSessionManager.getStatus();
    return res.json({ refreshed: true, valid: isValid, ...status });
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

// AC7 / AC8 — Interactive session setup: launches headed browser for manual Instagram login.
// Admin must complete login in the browser window that opens (timeout: 5 minutes).
// The resulting session is persisted and survives server restart.
forgeShadowFeedController.post('/session/setup', async (_req, res) => {
  try {
    const status = await instagramSessionManager.setupSession();
    return res.json({ success: true, ...status });
  } catch (error) {
    return res.status(500).json({
      error: errMsg(error),
      hint: 'Ensure the server is running locally with a display available (headed browser required).',
    });
  }
});

// Cadence (FSD-06)
forgeShadowFeedController.get('/cadence', async (_req, res) => {
  try {
    const result = forgeShadowFeedService.getCadence();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

forgeShadowFeedController.get('/cadence/today', async (_req, res) => {
  try {
    const result = forgeShadowFeedService.getCadenceToday();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

// Hook Archetypes (FSD-04, AC6)
forgeShadowFeedController.get('/hook-archetypes', async (_req, res) => {
  try {
    const archetypes = await forgeShadowFeedService.getHookArchetypes();
    return res.json({ archetypes });
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

// Stats
forgeShadowFeedController.get('/stats', async (_req, res) => {
  try {
    const result = await forgeShadowFeedService.getStats();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: errMsg(error) });
  }
});

export default forgeShadowFeedController;
