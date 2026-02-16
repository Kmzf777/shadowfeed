import { Router } from 'express';
import { forgePersonalizedCarousel, getAvailableThemes } from './forge-personalized.service.js';
import type { ForgePersonalizedRequest } from './forge-personalized.types.js';

const forgePersonalizedController = Router();

/**
 * Generate personalized carousel from URL
 */
forgePersonalizedController.post('/generate', async (req, res) => {
  try {
    const { url, title, summary, rawContent, category, themeId, userId, productMode, productDescription, ctaText } = req.body as ForgePersonalizedRequest;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!themeId) {
      return res.status(400).json({ error: 'Theme ID is required' });
    }

    if (!url && !title) {
      return res.status(400).json({ error: 'URL or title is required' });
    }

    const post = await forgePersonalizedCarousel({
      url,
      title,
      summary,
      rawContent,
      category,
      themeId,
      userId,
      productMode,
      productDescription,
      ctaText,
    });

    return res.json(post);
  } catch (error: any) {
    console.error('[FORGE-PERSONALIZED] Error generating carousel:', error);
    return res.status(500).json({
      error: error.message || 'Failed to generate carousel',
    });
  }
});

/**
 * Get all available themes
 */
forgePersonalizedController.get('/themes', (_req, res) => {
  try {
    const themes = getAvailableThemes();
    return res.json(themes);
  } catch (error: any) {
    console.error('[FORGE-PERSONALIZED] Error getting themes:', error);
    return res.status(500).json({
      error: error.message || 'Failed to get themes',
    });
  }
});

export default forgePersonalizedController;
