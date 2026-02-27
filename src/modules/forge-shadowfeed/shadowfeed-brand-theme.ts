import type { ThemeConfig } from '../../shared/themes/theme.types.js';

/**
 * ShadowFeed Brand exclusive theme — CRT terminal aesthetic.
 *
 * Spec § 5.1 properties:
 *   bg #0d0d0d | accent #8a00c4 | text #d4d4d4 / #808080
 *   fonts: Sora 700 (headline), DejaVu Sans Mono (body)
 *   border 1px solid #1e1e1e | border-radius 3px
 *
 * Special decorative elements (interpreted by frontend renderer):
 *   crt-scanline       — 2px repeating-linear-gradient overlay, opacity 0.04
 *   ghost-watermark    — ghost logo, bottom-right, opacity 0.15
 *   purple-gradient-hook — gradient #8a00c4 → #5c0099 (hook/pattern-interrupt bg)
 *   purple-border-glow — box-shadow purple glow (CTA slide)
 *   slide-number-monospace — number_label rendered as `// slide_XX` badge
 *
 * EXCLUSIVE: must NOT appear in the regular user theme picker.
 * Use getAvailableThemes() from post-themes.library.ts which filters exclusive themes.
 */
export const SHADOWFEED_BRAND_THEME: ThemeConfig & { exclusive: true } = {
  id: 'shadowfeed-brand',
  style: 'crt-terminal',
  exclusive: true,

  colors: {
    bg_primary: '#0d0d0d',
    bg_secondary: '#0d0d0d',
    text_on_primary: '#d4d4d4',
    text_on_secondary: '#d4d4d4',
    accent: '#8a00c4',
    text_secondary: '#808080',
    pattern_interrupt_bg: '#8a00c4',
    pattern_interrupt_text: '#ffffff',
  },

  fonts: {
    headline: 'Sora',
    body: 'DejaVu Sans Mono',
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
    // Hook: purple gradient bg (#8a00c4 → #5c0099) — AC4
    hook: {
      layout: 'crt-hook',
      bg: 'accent',
      text_align: 'left',
      font_weight_headline: '900',
      decorative_elements: [
        'crt-scanline',
        'ghost-watermark',
        'purple-gradient-hook',
        'slide-number-monospace',
      ],
    },

    content_with_image: {
      layout: 'crt-body',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: ['crt-scanline', 'ghost-watermark', 'slide-number-monospace'],
    },

    content_without_image: {
      layout: 'crt-body',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: ['crt-scanline', 'ghost-watermark', 'slide-number-monospace'],
    },

    content_with_list: {
      layout: 'crt-body',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: ['crt-scanline', 'ghost-watermark', 'slide-number-monospace'],
    },

    // Pattern interrupt also uses purple gradient (terminal highlight)
    pattern_interrupt: {
      layout: 'crt-body',
      bg: 'accent',
      text_align: 'center',
      font_weight_headline: '800',
      decorative_elements: ['crt-scanline', 'ghost-watermark', 'purple-gradient-hook'],
    },

    conflict: {
      layout: 'crt-body',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '800',
      decorative_elements: ['crt-scanline', 'ghost-watermark', 'slide-number-monospace'],
    },

    conclusion: {
      layout: 'crt-body',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '800',
      decorative_elements: [
        'crt-scanline',
        'ghost-watermark',
        'top-line-accent',
        'slide-number-monospace',
      ],
    },

    // CTA: black bg with purple border glow — AC5
    cta: {
      layout: 'crt-cta',
      bg: 'primary',
      text_align: 'center',
      font_weight_headline: '800',
      decorative_elements: ['crt-scanline', 'ghost-watermark', 'purple-border-glow'],
    },

    engagement: {
      layout: 'crt-cta',
      bg: 'primary',
      text_align: 'center',
      font_weight_headline: '700',
      decorative_elements: ['crt-scanline', 'ghost-watermark', 'slide-number-monospace'],
    },
  },

  // All slides use the same dark bg — uniform CRT look
  bgAlternation: 'uniform',
};
