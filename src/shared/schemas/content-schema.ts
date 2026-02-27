import { z } from 'zod';
import type { SlideRole } from '../types/pillar.types.js';

// ── Universal Slide Role ─────────────────────────────────────

export const SlideRoleEnum = z.enum([
  'hook',
  'context',
  'content',
  'tension',
  'soft-cta',
  'cta',
]);

export type { SlideRole } from '../types/pillar.types.js';

// ── Content Slide (GPT output — content only, no design) ─────

export const ContentSlideSchema = z.object({
  slide: z.number().int().min(1).max(20),
  role: SlideRoleEnum,
  headline: z.string().min(2).max(300),
  subtitle: z.string().max(300).nullable().optional(),
  body_markdown: z.string().max(2500).nullable().optional(),
  image: z.boolean().default(false),
  list: z.array(z.string()).nullable().optional(),
  number_label: z.string().nullable().optional(),
  // Authority-specific (optional, ignored by editorial)
  category_label: z.string().max(100).nullable().optional(),
  engagement_text: z.string().max(200).nullable().optional(),
  // Pexels integration
  image_keyword: z.string().optional(),
  image_url: z.string().url().optional(),
  image_credit: z.string().optional(),
});

// ── Content Carousel (full GPT output) ───────────────────────

export const ContentCarouselSchema = z.object({
  theme: z.string().min(5).max(200),
  total_slides: z.number().int().min(5).max(15),
  slides: z.array(ContentSlideSchema).min(5).max(15),
  caption: z.string().min(50).max(2200),
  hashtags: z
    .array(z.string().startsWith('#'))
    .min(3)
    .max(5),
  cta_text: z.string().min(3),
  best_posting_time: z.string(),
});

// ── Inferred types ───────────────────────────────────────────

export type ContentSlide = z.infer<typeof ContentSlideSchema>;
export type ContentCarousel = z.infer<typeof ContentCarouselSchema>;
