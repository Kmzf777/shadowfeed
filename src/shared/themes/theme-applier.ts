import type { ContentCarousel, ContentSlide } from '../schemas/content-schema.js';
import type { ThemeConfig, LayoutRule } from './theme.types.js';
import { logger } from '../../config/logger.js';

// ── Output types (match renderer's CarouselData / SlideData) ─

export interface AppliedSlide {
  slide: number;
  role: string;
  headline: string;
  subtitle: string | null;
  body: string | null;
  body_markdown: string | null;
  layout: string;
  bg_color: string;
  bg_gradient: string | null;
  text_color: string;
  accent_color: string;
  font_headline: string;
  font_body: string;
  font_size_headline: string;
  font_weight_headline: string;
  font_size_body: string;
  text_align: string;
  icon: string | null;
  number_label: string | null;
  decorative_elements: string[];
  image: {
    type: 'placeholder' | 'generated';
    prompt: string | null;
    url: string | null;
    position: string;
    aspect_ratio: string;
  } | null;
  // Authority-specific
  category_label?: string | null;
  engagement_text?: string | null;
  engagement_box_bg?: string | null;
}

export interface AppliedCarousel {
  theme: string;
  style: string;
  total_slides: number;
  branding: { name: string; handle: string };
  profile?: { display_name: string; username: string; avatar_url: string; verified: boolean };
  color_palette: {
    bg_primary: string;
    bg_secondary: string;
    text_primary: string;
    text_secondary: string;
    accent: string;
  };
  fonts: { headline: string; body: string };
  slides: AppliedSlide[];
  caption: string;
  hashtags: string[];
  cta_text: string;
  best_posting_time: string;
}

// ── Main function ────────────────────────────────────────────

export function applyTheme(
  content: ContentCarousel,
  theme: ThemeConfig
): AppliedCarousel {
  let bgToggle = false; // false = primary, true = secondary

  const appliedSlides: AppliedSlide[] = content.slides.map((slide, index) => {
    // 1. Resolve layout rule
    const rule = getLayoutRule(slide, theme);

    // 2. Determine background + text color
    let bgColor: string;
    let textColor: string;

    if (rule.bg === 'accent') {
      bgColor = theme.colors.pattern_interrupt_bg;
      textColor = theme.colors.pattern_interrupt_text;
    } else if (rule.bg === 'primary') {
      bgColor = theme.colors.bg_primary;
      textColor = theme.colors.text_on_primary;
    } else if (rule.bg === 'secondary') {
      bgColor = theme.colors.bg_secondary;
      textColor = theme.colors.text_on_secondary;
    } else {
      // 'inherit' → use alternation strategy
      if (theme.bgAlternation === 'alternate') {
        if (index === 0) {
          // Hook always dark
          bgColor = theme.colors.bg_primary;
          textColor = theme.colors.text_on_primary;
          bgToggle = false;
        } else {
          bgToggle = !bgToggle;
          bgColor = bgToggle
            ? theme.colors.bg_secondary
            : theme.colors.bg_primary;
          textColor = bgToggle
            ? theme.colors.text_on_secondary
            : theme.colors.text_on_primary;
        }
      } else {
        // uniform → always primary
        bgColor = theme.colors.bg_primary;
        textColor = theme.colors.text_on_primary;
      }
    }

    // 3. Adaptive font sizes
    const font_size_headline = computeAdaptiveHeadlineSize(
      slide.headline,
      slide.role === 'hook'
    );
    const bodyText = slide.body_markdown || '';
    const font_size_body = computeAdaptiveBodySize(bodyText);

    // 4. Image placeholder (or real Pexels image)
    let imageObj: AppliedSlide['image'] = null;
    if (slide.image) {
      const position = slide.role === 'hook' ? 'background' : 'inline';
      const aspect_ratio = position === 'background' ? '4:5' : '16:9';
      imageObj = {
        type: slide.image_url ? 'generated' : 'placeholder',
        prompt: slide.image_keyword || null,
        url: slide.image_url || null,
        position,
        aspect_ratio,
      };
    }

    // 5. Merge list into body_markdown
    let finalBodyMarkdown = slide.body_markdown || null;
    if (slide.list && slide.list.length > 0) {
      const listMarkdown = slide.list
        .map((item, i) => `${i + 1}. **${item}**`)
        .join('\n');
      finalBodyMarkdown = finalBodyMarkdown
        ? `${finalBodyMarkdown}\n\n${listMarkdown}`
        : listMarkdown;
    }

    // 6. Build applied slide
    const applied: AppliedSlide = {
      slide: slide.slide,
      role: slide.role,
      headline: slide.headline,
      subtitle: slide.subtitle || null,
      body: null,
      body_markdown: finalBodyMarkdown,
      layout: rule.layout,
      bg_color: bgColor,
      bg_gradient:
        slide.role === 'hook'
          ? `linear-gradient(180deg, transparent 0%, ${bgColor} 100%)`
          : null,
      text_color: textColor,
      accent_color: theme.colors.accent,
      font_headline: theme.fonts?.headline || 'Inter Tight',
      font_body: theme.fonts?.body || 'Inter',
      font_size_headline,
      font_weight_headline: rule.font_weight_headline,
      font_size_body,
      text_align: rule.text_align,
      icon: null,
      number_label: slide.number_label || null,
      decorative_elements: rule.decorative_elements,
      image: imageObj,
    };

    // Authority-specific fields
    if (slide.category_label) applied.category_label = slide.category_label;
    if (slide.engagement_text) {
      applied.engagement_text = slide.engagement_text;
      applied.engagement_box_bg = '#000000';
    }

    return applied;
  });

  // Enforce max 2 tweet-image-card for authority
  if (theme.id === 'authority') {
    let imageCardCount = 0;
    for (const s of appliedSlides) {
      if (s.layout === 'tweet-image-card') {
        imageCardCount++;
        if (imageCardCount > 2) {
          s.layout = 'tweet-card';
          s.image = null;
        }
      }
    }
  }

  logger.info(
    { theme: theme.id, slides: appliedSlides.length },
    '[THEME-APPLIER] Theme applied successfully'
  );

  return {
    theme: content.theme,
    style: theme.style,
    total_slides: content.total_slides,
    branding: theme.branding,
    profile: theme.profile,
    color_palette: {
      bg_primary: theme.colors.bg_primary,
      bg_secondary: theme.colors.bg_secondary,
      text_primary: theme.colors.text_on_primary,
      text_secondary: theme.colors.text_secondary,
      accent: theme.colors.accent,
    },
    fonts: { headline: theme.fonts?.headline || 'Inter Tight', body: theme.fonts?.body || 'Inter' },
    slides: appliedSlides,
    caption: content.caption,
    hashtags: content.hashtags,
    cta_text: content.cta_text,
    best_posting_time: content.best_posting_time,
  };
}

// ── Helpers ──────────────────────────────────────────────────

function getLayoutRule(slide: ContentSlide, theme: ThemeConfig): LayoutRule {
  const rules = theme.layoutRules;

  switch (slide.role) {
    case 'hook':
      return rules.hook;
    case 'content':
      if (slide.list && slide.list.length > 0) return rules.content_with_list;
      if (slide.image) return rules.content_with_image;
      return rules.content_without_image;
    case 'pattern-interrupt':
      return rules.pattern_interrupt;
    case 'conflict':
      return rules.conflict;
    case 'conclusion':
      return rules.conclusion;
    case 'cta':
      return rules.cta;
    case 'engagement':
      return rules.engagement;
    default:
      return rules.content_without_image;
  }
}

function computeAdaptiveHeadlineSize(text: string, isHook: boolean): string {
  const length = text.length;
  if (isHook) {
    if (length < 30) return '96px';
    if (length < 60) return '80px';
    return '64px';
  }
  if (length < 20) return '64px';
  if (length < 40) return '56px';
  return '48px';
}

function computeAdaptiveBodySize(text: string): string {
  if (!text) return '24px';
  const length = text.length;
  if (length < 200) return '32px';
  if (length < 400) return '28px';
  return '24px';
}
