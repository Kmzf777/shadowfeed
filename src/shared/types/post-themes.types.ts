/**
 * Voice tone options for content generation
 */
export type VoiceTone = 'professional' | 'friendly' | 'provocative' | 'inspirational' | 'humorous';

/**
 * Post theme configuration interface
 */
export interface PostTheme {
  id: string;
  name: string;
  description: string;
  systemPromptKey: string;
  themeId: string; // References theme in shared/themes/
  slideCount: { min: number; max: number };
  contentDensity: 'dense' | 'medium' | 'concise';
  style: string;
  emojiUsage: 'moderate' | 'light' | 'none';
  toneInstructions: Record<VoiceTone, string>;
}

/**
 * User profile data for content personalization
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
  product?: {
    enabled: boolean;
    description: string;
    ctaKeyword: string;
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
