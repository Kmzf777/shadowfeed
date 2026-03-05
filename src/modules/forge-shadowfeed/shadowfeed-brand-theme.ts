import type { ThemeConfig } from '../../shared/themes/theme.types.js';

/**
 * ShadowFeed Brand exclusive theme — CRT terminal aesthetic v2.
 *
 * Visual identity: matches the ShadowFeed website design.
 * Deep blacks (#060606–#0a0a0a), purple accent (#8a00c4), monospace typography,
 * HUD corner brackets, code-editor gutter, glitch text, terminal file paths,
 * ghost watermark, vignette, noise grain, dense scanlines.
 *
 * Colors:
 *   bg #060606 (void) / #0a0a0a (card) | accent #8a00c4 | text #d4d4d4 / #808080
 *   fonts: Sora 700-900 (headline), DejaVu Sans Mono (body, UI chrome)
 *
 * Decorative elements (interpreted by frontend renderer):
 *   crt-scanline         — dense 1px scanline overlay
 *   crt-glitch-bars      — horizontal glitch displacement bars on images
 *   crt-glitch-text      — magenta/cyan glitch offset on headlines
 *   ghost-watermark      — ghost logo, bottom-right, opacity 0.04
 *   hud-brackets         — corner targeting brackets in accent color
 *   code-gutter          — line numbers gutter on left side
 *   terminal-file-path   — VSCode-style file path in header
 *   status-bar           — bottom terminal status bar
 *   vignette             — darkened corners for CRT depth
 *   noise-texture        — subtle grain overlay
 *
 * EXCLUSIVE: must NOT appear in the regular user theme picker.
 */
export const SHADOWFEED_BRAND_THEME: ThemeConfig & { exclusive: true } = {
  id: 'shadowfeed-brand',
  style: 'crt-terminal',
  exclusive: true,

  colors: {
    bg_primary: '#060606',
    bg_secondary: '#0a0a0a',
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
    hook: {
      layout: 'crt-hook',
      bg: 'accent',
      text_align: 'left',
      font_weight_headline: '900',
      decorative_elements: [
        'crt-scanline',
        'crt-glitch-text',
        'crt-glitch-bars',
        'ghost-watermark',
        'hud-brackets',
        'code-gutter',
        'terminal-file-path',
        'status-bar',
        'vignette',
        'noise-texture',
      ],
    },

    content_with_image: {
      layout: 'crt-body',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [
        'crt-scanline',
        'crt-glitch-bars',
        'ghost-watermark',
        'hud-brackets',
        'code-gutter',
        'terminal-file-path',
        'status-bar',
        'vignette',
        'noise-texture',
      ],
    },

    content_without_image: {
      layout: 'crt-body',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [
        'crt-scanline',
        'ghost-watermark',
        'hud-brackets',
        'code-gutter',
        'terminal-file-path',
        'status-bar',
        'vignette',
        'noise-texture',
      ],
    },

    content_with_list: {
      layout: 'crt-body',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '700',
      decorative_elements: [
        'crt-scanline',
        'ghost-watermark',
        'hud-brackets',
        'code-gutter',
        'terminal-file-path',
        'status-bar',
        'vignette',
        'noise-texture',
      ],
    },

    pattern_interrupt: {
      layout: 'crt-body',
      bg: 'accent',
      text_align: 'center',
      font_weight_headline: '800',
      decorative_elements: [
        'crt-scanline',
        'ghost-watermark',
        'hud-brackets',
        'code-gutter',
        'terminal-file-path',
        'status-bar',
        'vignette',
        'noise-texture',
      ],
    },

    conflict: {
      layout: 'crt-body',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '800',
      decorative_elements: [
        'crt-scanline',
        'ghost-watermark',
        'hud-brackets',
        'code-gutter',
        'terminal-file-path',
        'status-bar',
        'vignette',
        'noise-texture',
      ],
    },

    conclusion: {
      layout: 'crt-body',
      bg: 'primary',
      text_align: 'left',
      font_weight_headline: '800',
      decorative_elements: [
        'crt-scanline',
        'ghost-watermark',
        'hud-brackets',
        'code-gutter',
        'terminal-file-path',
        'status-bar',
        'vignette',
        'noise-texture',
      ],
    },

    cta: {
      layout: 'crt-cta',
      bg: 'primary',
      text_align: 'center',
      font_weight_headline: '900',
      decorative_elements: [
        'crt-scanline',
        'crt-glitch-text',
        'ghost-watermark',
        'hud-brackets',
        'terminal-file-path',
        'status-bar',
        'vignette',
        'noise-texture',
      ],
    },

    engagement: {
      layout: 'crt-cta',
      bg: 'primary',
      text_align: 'center',
      font_weight_headline: '700',
      decorative_elements: [
        'crt-scanline',
        'ghost-watermark',
        'hud-brackets',
        'terminal-file-path',
        'status-bar',
        'vignette',
        'noise-texture',
      ],
    },
  },

  bgAlternation: 'uniform',
};
