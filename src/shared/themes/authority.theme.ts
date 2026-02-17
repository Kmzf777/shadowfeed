import type { ThemeConfig } from './theme.types.js';

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
