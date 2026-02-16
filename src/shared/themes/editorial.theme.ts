import type { ThemeConfig } from './theme.types.js';

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
