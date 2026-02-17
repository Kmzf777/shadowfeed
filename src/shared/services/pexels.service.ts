
import { logger } from '../../config/logger.js';

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || '';

export interface PexelsImageResult {
    url: string;
    photographer: string;
}

export async function fetchPexelsImageByKeyword(keyword: string, isHook: boolean): Promise<PexelsImageResult | null> {
    if (!PEXELS_API_KEY) {
        logger.warn('[PEXELS] No API Key provided. Skipping image fetch.');
        return null;
    }

    // Pexels suporta 'pt-BR' nativamente, o que é perfeito para as nossas keywords
    const orientation = isHook ? 'portrait' : 'landscape';
    const endpoint = `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=1&orientation=${orientation}&locale=pt-BR`;

    try {
        const response = await fetch(endpoint, {
            headers: { 'Authorization': PEXELS_API_KEY }
        });

        if (!response.ok) {
            logger.error({ status: response.status, statusText: response.statusText, keyword }, '[PEXELS] API request failed');
            return null;
        }

        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
            return {
                url: data.photos[0].src.large2x || data.photos[0].src.large,
                photographer: data.photos[0].photographer
            };
        }
        return null;
    } catch (err) {
        logger.error({ error: err, keyword }, '[PEXELS] Failed fetching local keyword image');
        return null;
    }
}
