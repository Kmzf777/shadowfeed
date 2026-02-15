// ── Theme Types (browser-compatible, no Node.js dependencies) ─────

export interface ThemeConfig {
  id: string;
  style: string;

  colors: {
    bg_primary: string;
    bg_secondary: string;
    text_on_primary: string;
    text_on_secondary: string;
    accent: string;
    text_secondary: string;
    pattern_interrupt_bg: string;
    pattern_interrupt_text: string;
  };

  fonts: {
    headline: string;
    body: string;
  };

  branding: {
    name: string;
    handle: string;
  };

  profile?: {
    display_name: string;
    username: string;
    avatar_url: string;
    verified: boolean;
  };

  layoutRules: LayoutRuleSet;

  bgAlternation: 'alternate' | 'uniform';
}

export interface LayoutRule {
  layout: string;
  bg: 'primary' | 'secondary' | 'accent' | 'inherit';
  text_align: 'left' | 'center' | 'right';
  font_weight_headline: '700' | '800' | '900';
  decorative_elements: string[];
}

export interface LayoutRuleSet {
  hook: LayoutRule;
  content_with_image: LayoutRule;
  content_without_image: LayoutRule;
  content_with_list: LayoutRule;
  pattern_interrupt: LayoutRule;
  conflict: LayoutRule;
  conclusion: LayoutRule;
  cta: LayoutRule;
  engagement: LayoutRule;
}

// ── Theme Definitions ─────────────────────────────────────────────

export const EDITORIAL_THEME: ThemeConfig = {
  id: 'editorial',
  style: 'editorial-mono',

  colors: {
    bg_primary: '#0A0A0A',
    bg_secondary: '#F5F0EB',
    text_on_primary: '#F5F0EB',
    text_on_secondary: '#0A0A0A',
    accent: '#8a00c4',
    text_secondary: '#A0A0A0',
    pattern_interrupt_bg: '#8a00c4',
    pattern_interrupt_text: '#0A0A0A',
  },

  fonts: {
    headline: 'Inter Tight',
    body: 'Inter',
  },

  branding: {
    name: 'ShadowFeed',
    handle: '@shadowfeed.ai',
  },

  profile: {
    display_name: 'ShadowFeed',
    username: '@shadowfeed.ai',
    avatar_url: '/logoavatar.png',
    verified: true,
  },

  layoutRules: {
    hook: {
      layout: 'hero-image',
      bg: 'primary',
      text_align: 'center',
      font_weight_headline: '900',
      decorative_elements: ['bottom-gradient-fade'],
    },
    content_with_image: {
      layout: 'article-body',
      bg: 'inherit',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [],
    },
    content_without_image: {
      layout: 'article-body',
      bg: 'inherit',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [],
    },
    content_with_list: {
      layout: 'article-body',
      bg: 'inherit',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [],
    },
    pattern_interrupt: {
      layout: 'title-body',
      bg: 'accent',
      text_align: 'center',
      font_weight_headline: '800',
      decorative_elements: [],
    },
    conflict: {
      layout: 'article-body',
      bg: 'inherit',
      text_align: 'left',
      font_weight_headline: '800',
      decorative_elements: [],
    },
    conclusion: {
      layout: 'article-body',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '800',
      decorative_elements: ['top-line-accent'],
    },
    cta: {
      layout: 'profile-card',
      bg: 'secondary',
      text_align: 'center',
      font_weight_headline: '800',
      decorative_elements: ['top-line-accent'],
    },
    engagement: {
      layout: 'title-body',
      bg: 'secondary',
      text_align: 'center',
      font_weight_headline: '700',
      decorative_elements: [],
    },
  },

  bgAlternation: 'alternate',
};

export const AUTHORITY_THEME: ThemeConfig = {
  id: 'authority',
  style: 'tweet-thread',

  colors: {
    bg_primary: '#FFFFFF',
    bg_secondary: '#0A0A0A',
    text_on_primary: '#0F1419',
    text_on_secondary: '#FFFFFF',
    accent: '#8a00c4',
    text_secondary: '#536471',
    pattern_interrupt_bg: '#8a00c4',
    pattern_interrupt_text: '#000000',
  },

  fonts: {
    headline: 'Inter',
    body: 'Inter',
  },

  branding: {
    name: 'ShadowFeed',
    handle: '@shadowfeed.ai',
  },

  profile: {
    display_name: 'ShadowFeed',
    username: '@shadowfeed.ai',
    avatar_url: '/logoavatar.png',
    verified: true,
  },

  layoutRules: {
    hook: {
      layout: 'tweet-hook',
      bg: 'secondary', // dark bg for hook
      text_align: 'left',
      font_weight_headline: '900',
      decorative_elements: [],
    },
    content_with_image: {
      layout: 'tweet-image-card',
      bg: 'primary', // white card
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [],
    },
    content_without_image: {
      layout: 'tweet-card',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [],
    },
    content_with_list: {
      layout: 'tweet-card',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [],
    },
    pattern_interrupt: {
      layout: 'tweet-card',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '800',
      decorative_elements: [],
    },
    conflict: {
      layout: 'tweet-card',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [],
    },
    conclusion: {
      layout: 'tweet-card',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [],
    },
    cta: {
      layout: 'tweet-cta',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [],
    },
    engagement: {
      layout: 'tweet-engagement',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [],
    },
  },

  bgAlternation: 'uniform',
};

// ── Content Types (from content_json field) ────────────────────

export interface ContentSlide {
  slide: number;
  role: string;
  headline: string;
  subtitle: string | null;
  body_markdown: string | null;
  image: boolean;
  list: string[] | null;
  number_label: string | null;
  category_label?: string | null;
  engagement_text?: string | null;
}

export interface ContentCarousel {
  theme: string;
  total_slides: number;
  slides: ContentSlide[];
  caption: string;
  hashtags: string[];
  cta_text: string;
  best_posting_time: string;
}

// ── Theme Applier Function (pure, browser-compatible) ──────────────────

export function applyTheme(
  content: ContentCarousel,
  theme: ThemeConfig
): any {
  let bgToggle = false; // false = primary, true = secondary

  const appliedSlides = content.slides.map((slide, index) => {
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

    // 4. Image placeholder
    let imageObj: any = null;
    if (slide.image) {
      const position = slide.role === 'hook' ? 'background' : 'inline';
      const aspect_ratio = position === 'background' ? '4:5' : '16:9';
      imageObj = {
        type: 'placeholder',
        prompt: null,
        url: null,
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

    // 6. Build applied slide (matches CarouselData format)
    const applied: any = {
      slide: slide.slide,
      role: slide.role,
      headline: slide.headline,
      subtitle: slide.subtitle || null,
      body: null,
      body_markdown: finalBodyMarkdown,
      layout: rule.layout,
      bg_color: bgColor,
      bg_gradient: slide.role === 'hook'
        ? `linear-gradient(180deg, transparent 0%, ${bgColor} 100%)`
        : null,
      text_color: textColor,
      accent_color: theme.colors.accent,
      font_headline: theme.fonts.headline,
      font_body: theme.fonts.body,
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
      text_secondary: theme.colors.text_on_secondary,
      accent: theme.colors.accent,
    },
    fonts: theme.fonts,
    slides: appliedSlides,
    caption: content.caption,
    hashtags: content.hashtags,
    cta_text: content.cta_text,
    best_posting_time: content.best_posting_time,
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────

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

// ── Exports for ClientPostView

export const EDITORIAL_LAYOUTS = [
  'hero-image', 'article-body', 'title-body', 'split-left', 'split-right',
  'profile-card', 'headline-only', 'numbered-item', 'bento-grid'
] as const;

export const AUTHORITY_LAYOUTS = [
  'tweet-hook', 'tweet-card', 'tweet-image-card', 'tweet-engagement', 'tweet-cta'
] as const;

export const HEADLINE_SIZES = ['48px', '56px', '64px', '72px', '80px', '96px'] as const;
export const BODY_SIZES = ['18px', '20px', '24px', '28px', '32px', '36px'] as const;

export const AVAILABLE_THEMES = [
  { id: 'editorial', name: 'Editorial Magazine', preview: { bg: '#0A0A0A', accent: '#8a00c4' } },
  { id: 'authority', name: 'Tweet Thread', preview: { bg: '#FFFFFF', accent: '#8a00c4' } },
] as const;
