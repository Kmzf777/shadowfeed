export interface SlideData {
  slide: number;
  role: 'hook' | 'content' | 'list' | 'quote' | 'cta' | 'tutorial' | 'comparison' | 'showcase' | 'pattern-interrupt' | 'conflict' | 'conclusion' | 'engagement'
  // Universal SlideRoles (PDCE pillar system)
  | 'context' | 'tension' | 'soft-cta';
  headline: string;
  subtitle?: string | null;
  body: string | null;
  body_markdown?: string | null; // Optional markdown body

  layout:
  | 'headline-only'
  | 'title-body'
  | 'numbered-item'
  | 'icon-title-body'
  | 'quote-attribution'
  | 'cta-action'
  | 'split-left'
  | 'split-right'
  | 'hero-image'
  | 'bento-grid'
  | 'step-focus'
  | 'profile-card'
  | 'article-body'
  // Tweet-thread layouts
  | 'tweet-hook'
  | 'tweet-card'
  | 'tweet-image-card'
  | 'tweet-engagement'
  | 'tweet-cta'
  // CRT layouts
  | 'crt-hook'
  | 'crt-body'
  | 'crt-quote'
  | 'crt-cta';

  bg_color: string;
  bg_gradient: string | null;
  text_color: string;
  accent_color: string;

  font_headline: string;
  font_body: string;
  font_size_headline: string;
  font_weight_headline: string;
  font_size_body: string;

  text_align: 'left' | 'center' | 'right';
  icon: string | null;
  number_label: string | null;
  decorative_elements: string[];

  image?: {
    type: 'placeholder' | 'generated' | 'upload';
    prompt: string | null;
    url: string | null;
    is_video?: boolean;
    style_ref?: string;
    position?: 'inline' | 'background' | 'bottom' | 'top';
    aspect_ratio?: '16:9' | '4:5' | '1:1';
  } | null;

  // Tweet-thread specific fields
  category_label?: string | null;
  engagement_text?: string | null;
  engagement_box_bg?: string | null;
}

export interface ProfileData {
  display_name: string;
  username: string;
  avatar_url: string;
  verified: boolean;
}

export interface CarouselData {
  theme: string;
  style: string;
  total_slides: number;
  branding?: {
    name: string;
    handle: string;
  } | null;
  profile?: ProfileData | null;
  color_palette: {
    bg_primary: string;
    bg_secondary: string;
    text_primary: string;
    text_secondary: string;
    accent: string;
  };
  fonts: {
    headline: string;
    body: string;
  };
  slides: SlideData[];
  caption: string;
  hashtags: string[];
  cta_text: string;
  best_posting_time: string;
}
