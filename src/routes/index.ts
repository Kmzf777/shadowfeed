import { Router } from 'express';
import reconController from '../modules/recon/recon.controller.js';
import forgeController from '../modules/forge/forge.controller.js';
import forgeAuthorityController from '../modules/forge-authority/forge-authority.controller.js';
import forgePersonalizedController from '../modules/forge-personalized/forge-personalized.controller.js';
import forgeSmartRouter from '../modules/forge-smart/forge-smart.controller.js';
import renderController from '../modules/render/render.controller.js';
import pipelineController from '../modules/pipeline/pipeline.controller.js';
import manualNewsController from '../modules/manual-news/manual-news.controller.js';
import creditsController from '../modules/credits/credits.controller.js';
import adminController from '../modules/admin/admin.controller.js';
import forgeShadowFeedController from '../modules/forge-shadowfeed/forge-shadowfeed.controller.js';
import pillarController from '../modules/pillar-system/pillar.controller.js';
import reconUltraController from '../modules/recon-ultra/recon-ultra.controller.js';

const router = Router();

// Health check
router.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    project: 'SHADOWFEED',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Module routes
router.use('/api/recon', reconController);
router.use('/api/forge', forgeController);
router.use('/api/forge-authority', forgeAuthorityController);
router.use('/api/forge-personalized', forgePersonalizedController);
router.use('/api/forge-smart', forgeSmartRouter);
router.use('/api/render', renderController);
router.use('/api/manual-news', manualNewsController);
router.use('/api/credits', creditsController);
router.use('/api/admin', adminController);
router.use('/api/forge-shadowfeed', forgeShadowFeedController);
router.use('/api/pillars', pillarController);
router.use('/api/recon-ultra', reconUltraController);
router.use('/api', pipelineController);

export default router;
