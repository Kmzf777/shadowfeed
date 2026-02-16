import { logger } from '../../config/logger.js';
import { runFullRecon } from '../recon/recon.service.js';
import { forgeCarousel } from '../forge/forge.service.js';
import { renderPost } from '../render/render.service.js';
import type { GeneratedPost } from '../../shared/types/global.types.js';

export interface PipelineResult {
  recon: { total_collected: number; total_errors: number };
  forge: { postId: string; theme: string; slides: number } | null;
  render: { postId: string; slideCount: number; paths: string[] } | null;
  duration_ms: number;
  success: boolean;
}

let lastPipelineResult: PipelineResult | null = null;

export function getLastPipelineStatus(): PipelineResult | null {
  return lastPipelineResult;
}

export async function runPipeline(): Promise<PipelineResult> {
  const startTime = Date.now();
  logger.info('[PIPELINE] Full pipeline initiated: RECON → FORGE → RENDER');

  const result: PipelineResult = {
    recon: { total_collected: 0, total_errors: 0 },
    forge: null,
    render: null,
    duration_ms: 0,
    success: false,
  };

  try {
    // 1. RECON — Collect intel from all sources
    logger.info('[PIPELINE] Phase 1: RECON');
    const reconResult = await runFullRecon();
    result.recon = {
      total_collected: reconResult.total_collected,
      total_errors: reconResult.total_errors,
    };

    // 2. FORGE — Generate a carousel
    logger.info('[PIPELINE] Phase 2: FORGE');
    let post: GeneratedPost;
    try {
      post = await forgeCarousel();
      result.forge = {
        postId: post.id,
        theme: post.theme,
        slides: post.slide_count,
      };
    } catch (err) {
      logger.error({ error: (err as Error).message }, '[PIPELINE] FORGE failed');
      result.duration_ms = Date.now() - startTime;
      lastPipelineResult = result;
      return result;
    }

    // 3. RENDER — Generate PNGs
    logger.info('[PIPELINE] Phase 3: RENDER');
    try {
      const renderResult = await renderPost(post.id);
      result.render = {
        postId: renderResult.postId,
        slideCount: renderResult.slideCount,
        paths: renderResult.paths,
      };
      result.success = true;
    } catch (err) {
      logger.error({ error: (err as Error).message }, '[PIPELINE] RENDER failed');
    }
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[PIPELINE] Pipeline failed');
  }

  result.duration_ms = Date.now() - startTime;
  lastPipelineResult = result;

  logger.info(
    { success: result.success, durationMs: result.duration_ms },
    '[PIPELINE] Pipeline complete'
  );

  return result;
}
