import {
  ContentCarouselSchema,
  EditorialRoleEnum,
  AuthorityRoleEnum,
} from './content-schema.js';
import type { ContentCarousel } from './content-schema.js';
import { logger } from '../../config/logger.js';

export type PipelineType = 'editorial' | 'authority';

export function parseAndValidateContent(
  raw: string,
  pipeline: PipelineType
): ContentCarousel {
  // Strip markdown code fences if present
  const cleaned = raw
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    logger.error(
      { raw: cleaned.slice(0, 200) },
      '[CONTENT-VALIDATOR] JSON parse failed'
    );
    throw new Error(`Invalid JSON from OpenAI: ${(e as Error).message}`);
  }

  const result = ContentCarouselSchema.safeParse(parsed);

  if (!result.success) {
    const errors = result.error.issues.map(
      (i) => `${i.path.join('.')}: ${i.message}`
    );
    logger.error({ errors }, '[CONTENT-VALIDATOR] Zod validation failed');
    throw new Error(`Content schema validation failed:\n${errors.join('\n')}`);
  }

  const data = result.data;

  // ── Structural validations ─────────────────────────────────

  if (data.slides.length !== data.total_slides) {
    throw new Error(
      `total_slides (${data.total_slides}) != slides.length (${data.slides.length})`
    );
  }

  if (data.slides[0].role !== 'hook') {
    throw new Error('First slide must have role "hook"');
  }

  if (data.slides[data.slides.length - 1].role !== 'cta') {
    throw new Error('Last slide must have role "cta"');
  }

  // ── Pipeline-specific role validation ──────────────────────

  const allowedRoles =
    pipeline === 'editorial'
      ? EditorialRoleEnum.options
      : AuthorityRoleEnum.options;

  for (const slide of data.slides) {
    if (!(allowedRoles as readonly string[]).includes(slide.role)) {
      logger.warn(
        { slide: slide.slide, role: slide.role, pipeline },
        '[CONTENT-VALIDATOR] Unexpected role for pipeline'
      );
    }
  }

  // ── Pipeline-specific structural warnings ──────────────────

  if (pipeline === 'authority') {
    const hasEngagement = data.slides.some((s) => s.role === 'engagement');
    if (!hasEngagement) {
      logger.warn(
        '[CONTENT-VALIDATOR] Authority carousel missing engagement slide'
      );
    }
  }

  if (pipeline === 'editorial' && data.slides.length >= 9) {
    const hasPatternInterrupt = data.slides.some(
      (s) => s.role === 'pattern-interrupt'
    );
    if (!hasPatternInterrupt) {
      logger.warn(
        '[CONTENT-VALIDATOR] Editorial carousel 9+ slides missing pattern-interrupt'
      );
    }
  }

  logger.info(
    { pipeline, slides: data.slides.length, theme: data.theme },
    '[CONTENT-VALIDATOR] Content validated successfully'
  );

  return data;
}
