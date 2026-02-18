import { Router, type Request, type Response } from 'express';
import { logger } from '../../config/logger.js';
import { forgeSmartCarousel } from './forge-smart.service.js';
import type { ForgeSmartRequest } from './forge-smart.types.js';

const router = Router();

router.post('/generate', (req: Request, res: Response) => {
  const body = req.body as ForgeSmartRequest;

  if (!body.userId || !body.themeId) {
    res.status(400).json({ error: 'userId and themeId are required' });
    return;
  }

  // Fire-and-forget: return 202 immediately
  res.status(202).json({ success: true, message: 'Smart generation started' });

  // Process in background — errors are logged, not returned to client
  forgeSmartCarousel(body).catch((err: Error) => {
    logger.error(
      { userId: body.userId, themeId: body.themeId, error: err.message },
      '[FORGE-SMART] Background generation failed'
    );
  });
});

export default router;
