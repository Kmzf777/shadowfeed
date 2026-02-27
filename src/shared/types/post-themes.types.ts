import type { SlideRole, PillarConfig } from './pillar.types.js';

/**
 * Voice tone options for content generation
 */
export type VoiceTone = 'professional' | 'friendly' | 'provocative' | 'inspirational' | 'humorous';

/**
 * Audience awareness levels (Eugene Schwartz scale)
 */
export type AudienceAwareness = 'unaware' | 'problem_aware' | 'solution_aware' | 'brand_aware' | 'most_aware';

/**
 * Content depth preference
 */
export type ContentDepth = 'shallow' | 'balanced' | 'dense';

/**
 * Primary content goal
 */
export type PrimaryGoal = 'grow_audience' | 'generate_leads' | 'direct_sales' | 'build_authority' | 'balanced';

/**
 * User offer / product saved during setup
 */
export interface UserOffer {
  name: string;
  type: string;
  main_benefit: string;
  price_range: string;
  purchase_method: string;
  cta_keyword: string;
  is_primary: boolean;
}

/**
 * Layout type for slide rendering (e.g., 'hero-image', 'tweet-hook', 'article-body')
 */
export type LayoutType = string;

/**
 * Color palette configuration for a theme
 */
export interface ThemeColorPalette {
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
}

/**
 * Font configuration for a theme
 */
export interface ThemeFonts {
  headline: string;
  body: string;
}

/**
 * Post theme configuration interface — pure visual design layer.
 * Content-logic fields (slideCount, contentDensity, emojiUsage, etc.)
 * have been migrated to PillarConfig (see pillar.types.ts).
 */
export interface PostTheme {
  id: string;
  name: string;
  description: string;
  preview?: string;
  colorPalette: ThemeColorPalette;
  fonts: ThemeFonts;
  backgroundStrategy: 'alternate' | 'uniform';
  layoutMap: Partial<Record<SlideRole, LayoutType>>;
  borderRadius?: number;
  decorativeElements?: string[];
  /** When true, theme is internal-only — filtered out of user-facing theme selection */
  exclusive?: boolean;
}

/**
 * User profile data for content personalization (Setup V2 complete)
 */
export interface UserProfile {
  id: string;
  instagram_handle: string | null;
  instagram_username: string | null;
  target_audience: string | null;
  main_pain_point: string | null;
  voice_tone: VoiceTone;
  user_prompt: string | null;
  avatar_path: string | null;
  setup_completed: boolean;

  // ── Setup V2 fields ────────────────────────────────────────────────
  niche: string | null;
  expertise_statement: string | null;
  transformation_before: string | null;
  transformation_after: string | null;
  audience_frustration: string | null;
  audience_desire: string | null;
  audience_objection: string | null;
  audience_awareness: AudienceAwareness | null;
  content_pillars: string[] | null;
  primary_goal: PrimaryGoal | null;
  content_depth: ContentDepth | null;
  posting_frequency: string | null;
  avoid_topics: string | null;
  brand_personality: string[] | null;
  offers: UserOffer[] | null;
}

/**
 * Context for personalized content generation
 */
export interface PersonalizedForgeContext {
  source: {
    title: string;
    summary: string | null;
    url: string | null;
    category: string | null;
    raw_content?: string;
  };
  userProfile: UserProfile;
  theme: PostTheme;
  pillar: PillarConfig;
  product?: {
    enabled: boolean;
    offer: UserOffer;
  };
}

/**
 * Request for generating personalized posts
 */
export interface PersonalizedForgeRequest {
  url?: string;
  title?: string;
  summary?: string;
  rawContent?: string;
  category?: string;
  themeId: string; // 'magazine' | 'twitter' | etc.
  userId: string;
}
