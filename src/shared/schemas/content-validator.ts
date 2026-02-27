import {
  ContentCarouselSchema,
  SlideRoleEnum,
} from './content-schema.js';
import type { ContentCarousel } from './content-schema.js';
import type { SlideRole } from '../types/pillar.types.js';
import { logger } from '../../config/logger.js';

// ── Legacy Role Mapping ──────────────────────────────────────

const LEGACY_ROLE_MAP: Record<string, SlideRole> = {
  // Editorial legacy roles
  'pattern-interrupt': 'tension',
  'conflict': 'tension',
  'conclusion': 'soft-cta',
  // Authority legacy roles
  'engagement': 'content',
};

/**
 * Maps legacy role values to universal SlideRole.
 * Returns the role unchanged if it is already a universal role.
 */
export function mapLegacyRole(role: string): SlideRole {
  const universalRoles = SlideRoleEnum.options as readonly string[];
  if (universalRoles.includes(role)) {
    return role as SlideRole;
  }
  const mapped = LEGACY_ROLE_MAP[role];
  if (mapped) {
    return mapped;
  }
  // Fallback: unknown roles default to 'content'
  logger.warn(
    { role },
    '[CONTENT-VALIDATOR] Unknown legacy role, defaulting to "content"'
  );
  return 'content';
}

// ── Validator ────────────────────────────────────────────────

export function parseAndValidateContent(
  raw: string,
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
    throw new Error(`Invalid JSON from LLM: ${(e as Error).message}`);
  }

  // ── Map legacy roles before Zod validation ───────────────
  if (
    parsed &&
    typeof parsed === 'object' &&
    'slides' in parsed &&
    Array.isArray((parsed as Record<string, unknown>).slides)
  ) {
    const slides = (parsed as Record<string, unknown>).slides as Array<Record<string, unknown>>;
    for (const slide of slides) {
      if (typeof slide.role === 'string') {
        slide.role = mapLegacyRole(slide.role);
      }
    }
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
    logger.warn(
      { declared: data.total_slides, actual: data.slides.length },
      '[CONTENT-VALIDATOR] total_slides mismatch — auto-correcting to actual slides count',
    );
    data.total_slides = data.slides.length;
  }

  if (data.slides[0].role !== 'hook') {
    throw new Error('First slide must have role "hook"');
  }

  if (data.slides[data.slides.length - 1].role !== 'cta') {
    throw new Error('Last slide must have role "cta"');
  }

  logger.info(
    { slides: data.slides.length, theme: data.theme },
    '[CONTENT-VALIDATOR] Content validated successfully'
  );

  return data;
}
