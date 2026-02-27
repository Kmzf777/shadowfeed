// ── Pillar IDs ────────────────────────────────────────────────────────────────

export type PillarId =
  | 'educational-value'
  | 'wake-up-slap'
  | 'brand-breakdown'
  | 'proof-social'
  | 'the-offer';

// Legacy compat alias (for existing queue data)
export type LegacyPillarId = 'proof-of-machine' | 'shadow-school';
export type AllPillarId = PillarId | LegacyPillarId;

// ── Hook & Funnel Types (foundation for FSD-04, FSD-05) ──────────────────────

export type HookArchetype =
  | 'direct-controversy'
  | 'specific-number'
  | 'transformative-promise'
  | 'polarization'
  | 'curiosity-mystery'
  | 'brand-comparison';

export type FunnelTier = 'top' | 'middle' | 'bottom';
export type SeedIntensity = 'whisper' | 'mention' | 'spotlight';
export type SeedPlacement = 'caption' | 'penultimate' | 'last';

// ── Slide Roles (7-zone anatomy) ─────────────────────────────────────────────

export type SlideRole = 'hook' | 'context' | 'content' | 'tension' | 'soft-cta' | 'cta';

// ── Templates ─────────────────────────────────────────────────────────────────

export interface PillarTemplate {
  id: string;
  theme: string;
  hookLine: string;
  bodyHints: string[];
  variables: string[];
  toneIntensity: 'max' | 'high' | 'medium';
  slideRange: { min: number; max: number };
}

// ── Queue & Config Types ──────────────────────────────────────────────────────

export type QueueStatus = 'pending' | 'generating' | 'ready' | 'approved' | 'posting' | 'posted' | 'failed';
export type CaptionStyle = 'A' | 'B' | 'C';
export type ThemeSource = 'brand' | 'showcase';
export type LlmProvider = 'openai' | 'groq' | 'gemini';

export interface PillarConfig {
  id: PillarId;
  proportion: number;
  time: string;
  active: boolean;
  contentType: string;
  slides: { min: number; max: number };
  discoveryRatio: number;
}

export interface ShadowFeedPillar extends PillarConfig {
  name: string;
}

// ── Discovery & Research ──────────────────────────────────────────────────────

export interface DiscoverySource {
  title: string;
  url: string;
  source: string;
  score: number;
  trending?: boolean;
}

export interface ResearchDigest {
  keyInsight: string;
  dataPoints: string[];
  provocativeAngle: string;
  educationalAngle: string;
  brandMentions: string[];
  quotableLines: string[];
  contentDepth: 'shallow' | 'medium' | 'deep';
  rawBody: string;
}

// ── Prompt Source ─────────────────────────────────────────────────────────────

export type PromptSource =
  | { type: 'discovery'; data: DiscoverySource }
  | { type: 'research'; data: ResearchDigest }
  | { type: 'template'; data: PillarTemplate };

// ── Queue Item ────────────────────────────────────────────────────────────────

export interface ShadowFeedQueueItem {
  id: string;
  pillarId: PillarId;
  scheduledDate: string;
  scheduledTime: string;
  status: QueueStatus;
  postId: string | null;
  themeUsed: string;
  discoverySource: DiscoverySource | null;
  templateUsed: string | null;
  generationTimeMs: number | null;
  errorMessage: string | null;
  funnelTier: FunnelTier | null;
  doubleDoorSeed: { seedText: string; placement: SeedPlacement; intensity: SeedIntensity } | null;
}

// ── Config ────────────────────────────────────────────────────────────────────

export interface ShadowFeedConfig {
  id: string;
  publishEnabled: boolean;
  pillars: PillarConfig[];
  themeBrandRatio: number;
  llmProvider: LlmProvider;
  updatedAt: string;
}

export interface BatchGenerationResult {
  success: boolean;
  generated: number;
  failed: number;
  items: ShadowFeedQueueItem[];
}

// ── PILLARS Constant (v2 — 5 pillars, BrandsDecoded proportions) ─────────────

export const PILLARS: ShadowFeedPillar[] = [
  {
    id: 'educational-value',
    name: 'EDUCATIONAL VALUE',
    proportion: 0.30,
    time: '09:00',
    active: true,
    contentType: 'technical-value/tutorials',
    slides: { min: 8, max: 12 },
    discoveryRatio: 0.7,
  },
  {
    id: 'wake-up-slap',
    name: 'WAKE-UP SLAP',
    proportion: 0.25,
    time: '11:00',
    active: true,
    contentType: 'counter-narrative/controversy',
    slides: { min: 4, max: 6 },
    discoveryRatio: 0.3,
  },
  {
    id: 'brand-breakdown',
    name: 'BRAND BREAKDOWN',
    proportion: 0.20,
    time: '14:00',
    active: true,
    contentType: 'brand-strategy-analysis',
    slides: { min: 10, max: 14 },
    discoveryRatio: 0.9,
  },
  {
    id: 'proof-social',
    name: 'PROOF SOCIAL',
    proportion: 0.15,
    time: '17:00',
    active: true,
    contentType: 'results/behind-the-scenes',
    slides: { min: 6, max: 8 },
    discoveryRatio: 0.2,
  },
  {
    id: 'the-offer',
    name: 'THE OFFER',
    proportion: 0.10,
    time: '20:00',
    active: true,
    contentType: 'direct-sale/anchoring',
    slides: { min: 8, max: 10 },
    discoveryRatio: 0.0,
  },
];
