import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { env } from '../../config/env.js';
import { forgeShadowFeedService } from './forge-shadowfeed.service.js';
import type { PillarId } from './forge-shadowfeed.types.js';
import { instagramSessionManager } from '../shadowfeed-publisher/instagram-session.manager.js';

const forgeShadowFeedController = Router();

const NOT_IMPLEMENTED = { status: 501, message: 'Not implemented' };

function adminTokenMiddleware(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers['x-sf-admin-token'] || req.query['token'];

  if (!token || token !== env.SHADOWFEED_ADMIN_TOKEN) {
    res.status(404).json({ error: 'Not found' });
    return;
  }

  next();
}

forgeShadowFeedController.use(adminTokenMiddleware);

// Geração
forgeShadowFeedController.post('/generate-batch', async (_req, res) => {
  try {
    const result = await forgeShadowFeedService.generateBatch();
    return res.json(result);
  } catch {
    return res.status(501).json(NOT_IMPLEMENTED);
  }
});

forgeShadowFeedController.post('/generate/:pillarId', async (req, res) => {
  try {
    const result = await forgeShadowFeedService.generatePillar(req.params.pillarId as PillarId);
    return res.json(result);
  } catch {
    return res.status(501).json(NOT_IMPLEMENTED);
  }
});

// Fila e aprovação
forgeShadowFeedController.get('/queue/recent', async (_req, res) => {
  try {
    const result = await forgeShadowFeedService.getRecentPosts();
    return res.json(result);
  } catch {
    return res.status(501).json(NOT_IMPLEMENTED);
  }
});

forgeShadowFeedController.get('/queue', async (req, res) => {
  try {
    const result = await forgeShadowFeedService.getQueue(req.query['date'] as string | undefined);
    return res.json(result);
  } catch {
    return res.status(501).json(NOT_IMPLEMENTED);
  }
});

forgeShadowFeedController.put('/queue/:id/approve', async (req, res) => {
  try {
    const result = await forgeShadowFeedService.approvePost(req.params.id);
    return res.json(result);
  } catch {
    return res.status(501).json(NOT_IMPLEMENTED);
  }
});

forgeShadowFeedController.put('/queue/:id/caption', async (req, res) => {
  try {
    const { caption } = req.body as { caption: string };
    const result = await forgeShadowFeedService.updateCaption(req.params.id, caption);
    return res.json(result);
  } catch {
    return res.status(501).json(NOT_IMPLEMENTED);
  }
});

forgeShadowFeedController.post('/queue/:id/publish-now', async (req, res) => {
  try {
    const result = await forgeShadowFeedService.publishNow(req.params.id);
    return res.json(result);
  } catch {
    return res.status(501).json(NOT_IMPLEMENTED);
  }
});

// Configuração
forgeShadowFeedController.get('/config', async (_req, res) => {
  try {
    const result = await forgeShadowFeedService.getConfig();
    return res.json(result);
  } catch {
    return res.status(501).json(NOT_IMPLEMENTED);
  }
});

forgeShadowFeedController.put('/config', async (req, res) => {
  try {
    const result = await forgeShadowFeedService.updateConfig(req.body);
    return res.json(result);
  } catch {
    return res.status(501).json(NOT_IMPLEMENTED);
  }
});

// Instagram session
forgeShadowFeedController.get('/session/status', async (_req, res) => {
  try {
    const status = await instagramSessionManager.getStatus();
    return res.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

forgeShadowFeedController.post('/session/refresh', async (_req, res) => {
  try {
    const isValid = await instagramSessionManager.isSessionValid();
    const status = await instagramSessionManager.getStatus();
    return res.json({ refreshed: true, valid: isValid, ...status });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
});

// Métricas
forgeShadowFeedController.get('/stats', (_req, res) => {
  return res.status(501).json(NOT_IMPLEMENTED);
});

export default forgeShadowFeedController;
