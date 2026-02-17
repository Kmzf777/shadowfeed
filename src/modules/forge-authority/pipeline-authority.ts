import 'dotenv/config';
import { logger } from '../../config/logger.js';
import { runTrendsEnrichedRecon } from '../recon/recon.service.js';
import { forgeAuthorityCarousel } from './forge-authority.service.js';
import { renderPost } from '../render/render.service.js';
import type { GeneratedPost } from '../../shared/types/global.types.js';

export interface AuthorityPipelineResult {
  recon: { collected: number; errors: number };
  forge: { postId: string; theme: string; slides: number } | null;
  render: { postId: string; slideCount: number; paths: string[] } | null;
  duration_ms: number;
  success: boolean;
}

export async function runAuthorityPipeline(): Promise<AuthorityPipelineResult> {
  const startTime = Date.now();
  logger.info('[PIPELINE-AUTHORITY] Pipeline initiated: RECON(trends-enriched) → FORGE-AUTHORITY → RENDER');

  const result: AuthorityPipelineResult = {
    recon: { collected: 0, errors: 0 },
    forge: null,
    render: null,
    duration_ms: 0,
    success: false,
  };

  try {
    // 1. RECON — Collect enriched trends from Google Trends
    logger.info('[PIPELINE-AUTHORITY] Phase 1: RECON (Google Trends Enriched)');
    const reconResult = await runTrendsEnrichedRecon();
    result.recon = {
      collected: reconResult.collected,
      errors: reconResult.errors,
    };

    logger.info(
      { collected: reconResult.collected },
      '[PIPELINE-AUTHORITY] RECON complete'
    );

    // 2. FORGE AUTHORITY — Generate tweet-thread carousel
    logger.info('[PIPELINE-AUTHORITY] Phase 2: FORGE AUTHORITY');
    let post: GeneratedPost;
    try {
      post = await forgeAuthorityCarousel();
      result.forge = {
        postId: post.id,
        theme: post.theme,
        slides: post.slide_count,
      };

      logger.info(
        { postId: post.id, theme: post.theme, slides: post.slide_count },
        '[PIPELINE-AUTHORITY] FORGE complete'
      );
    } catch (err) {
      logger.error({ error: (err as Error).message }, '[PIPELINE-AUTHORITY] FORGE failed');
      result.duration_ms = Date.now() - startTime;
      return result;
    }

    // 3. RENDER — Generate PNGs
    logger.info('[PIPELINE-AUTHORITY] Phase 3: RENDER');
    try {
      const renderResult = await renderPost(post.id);
      result.render = {
        postId: renderResult.postId,
        slideCount: renderResult.slideCount,
        paths: renderResult.paths,
      };
      result.success = true;

      logger.info(
        { postId: post.id, pngs: renderResult.slideCount },
        '[PIPELINE-AUTHORITY] RENDER complete'
      );
    } catch (err) {
      logger.error({ error: (err as Error).message }, '[PIPELINE-AUTHORITY] RENDER failed');
    }
  } catch (err) {
    logger.error({ error: (err as Error).message }, '[PIPELINE-AUTHORITY] Pipeline failed');
  }

  result.duration_ms = Date.now() - startTime;

  logger.info(
    {
      success: result.success,
      durationMs: result.duration_ms,
      theme: result.forge?.theme,
      slides: result.render?.slideCount,
    },
    '[PIPELINE-AUTHORITY] Pipeline complete'
  );

  return result;
}

// ── Standalone execution ─────────────────────────────────────────────
// Run with: npx tsx src/modules/forge-authority/pipeline-authority.ts

const isDirectRun = process.argv[1]?.includes('pipeline-authority');

if (isDirectRun) {
  runAuthorityPipeline()
    .then((result) => {
      console.log('\n════════════════════════════════════════');
      console.log('  PIPELINE AUTHORITY — RESULTADO');
      console.log('════════════════════════════════════════');
      console.log(`  RECON:  ${result.recon.collected} trends coletadas`);
      console.log(`  FORGE:  ${result.forge ? result.forge.theme : 'FALHOU'}`);
      console.log(`  RENDER: ${result.render ? `${result.render.slideCount} PNGs` : 'PULADO'}`);
      console.log(`  TEMPO:  ${(result.duration_ms / 1000).toFixed(1)}s`);
      console.log(`  STATUS: ${result.success ? 'SUCESSO' : 'FALHOU'}`);
      console.log('════════════════════════════════════════\n');
      process.exit(result.success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Pipeline error:', err);
      process.exit(1);
    });
}
