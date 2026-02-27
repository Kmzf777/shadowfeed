import { Router, type Request, type Response } from 'express';
import { logger } from '../../config/logger.js';
import { forgeSmartCarousel, discoverCandidates } from './forge-smart.service.js';
import type { ForgeSmartRequest, DiscoverRequest } from './forge-smart.types.js';
import { ALL_PILLAR_IDS } from '../pillar-system/pillar-configs.js';

const router = Router();

router.post('/generate', (req: Request, res: Response) => {
  const body = req.body as ForgeSmartRequest;

  if (!body.userId || !body.themeId || !body.pillarId) {
    res.status(400).json({ error: 'userId, themeId, and pillarId are required' });
    return;
  }

  if (!ALL_PILLAR_IDS.includes(body.pillarId)) {
    res.status(400).json({ error: `Invalid pillarId. Valid values: ${ALL_PILLAR_IDS.join(', ')}` });
    return;
  }

  // Fire-and-forget: return 202 immediately
  res.status(202).json({ success: true, message: 'Smart generation started' });

  // Process in background — errors are logged, not returned to client
  forgeSmartCarousel(body).catch((err: Error) => {
    logger.error(
      { userId: body.userId, themeId: body.themeId, pillarId: body.pillarId, error: err.message },
      '[FORGE-SMART] Background generation failed'
    );
  });
});

router.post('/discover', async (req: Request, res: Response) => {
  const body = req.body as DiscoverRequest;

  if (!body.userId || !body.pillarId) {
    res.status(400).json({ error: 'userId and pillarId are required' });
    return;
  }

  if (!ALL_PILLAR_IDS.includes(body.pillarId)) {
    res.status(400).json({ error: `Invalid pillarId. Valid values: ${ALL_PILLAR_IDS.join(', ')}` });
    return;
  }

  try {
    const result = await discoverCandidates(body);
    res.json(result);
  } catch (err) {
    logger.error({ userId: body.userId, pillarId: body.pillarId, error: (err as Error).message }, '[FORGE-SMART:DISCOVER] Failed');
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
