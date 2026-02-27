export type PillarId = 'educate' | 'provoke' | 'prove' | 'connect' | 'convert';

export type SlideRole = 'hook' | 'context' | 'content' | 'tension' | 'soft-cta' | 'cta';

export type HookArchetypeId =
  | 'direct-controversy'
  | 'specific-number'
  | 'transformative-promise'
  | 'polarization'
  | 'curiosity-mystery'
  | 'social-proof';

export type SourceType = 'google_news' | 'reddit' | 'twitter';

export interface ScoringWeights {
  recency: number;
  engagement: number;
  relevance: number;
  richness: number;
}

export interface PillarConfig {
  id: PillarId;
  name: string;
  description: string;
  icon: string;
  proportion: number;
  slideRange: { min: number; max: number };
  requiredRoles: SlideRole[];
  optionalRoles: SlideRole[];
  objective: string;
  requiredElements: string[];
  forbiddenElements: string[];
  toneOverride: string;
  ctaStyle: string;
  captionStyle: 'one-liner' | 'micro-story' | 'challenge';
  queryAngles: string[];
  sourceWeights: Record<SourceType, number>;
  scoringWeights: ScoringWeights;
  hookAffinityBoost: Record<HookArchetypeId, number>;
  productSeedIntensity: 'none' | 'whisper' | 'mention' | 'full';
}

export interface PillarDisplayConfig {
  id: PillarId;
  name: string;
  description: string;
  icon: string;
  slideRange: { min: number; max: number };
  ctaStyle: string;
}
