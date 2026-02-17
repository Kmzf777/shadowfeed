// ── Layout Rule ──────────────────────────────────────────────

export interface LayoutRule {
  layout: string;
  /** Which background bucket to use: primary, secondary, accent, or inherit (alternation) */
  bg: 'primary' | 'secondary' | 'accent' | 'inherit';
  text_align: 'left' | 'center' | 'right';
  font_weight_headline: '700' | '800' | '900';
  decorative_elements: string[];
}

// ── Layout Rule Set (role+content → layout) ──────────────────

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

// ── Theme Configuration ──────────────────────────────────────

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

  /** 'alternate' = editorial (dark/light toggle), 'uniform' = authority (all same bg) */
  bgAlternation: 'alternate' | 'uniform';
}
