export type PillarId = 'wake-up-slap' | 'proof-of-machine' | 'shadow-school' | 'the-offer';

export interface PillarTemplate {
  id: string;
  theme: string;
  hookLine: string;
  bodyHints: string[];
  variables: string[];
  toneIntensity: 'max' | 'high' | 'medium';
  slideRange: { min: number; max: number };
}
export type QueueStatus = 'pending' | 'generating' | 'ready' | 'approved' | 'posting' | 'posted' | 'failed';
export type CaptionStyle = 'A' | 'B' | 'C';
export type ThemeSource = 'brand' | 'showcase';

export interface PillarConfig {
  id: PillarId;
  time: string;
  active: boolean;
  contentType: string;
  slides: { min: number; max: number };
  discoveryRatio: number;
}

export interface ShadowFeedPillar extends PillarConfig {
  name: string;
}

export interface DiscoverySource {
  title: string;
  url: string;
  source: string;
  score: number;
  trending?: boolean;
}

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
}

export interface ShadowFeedConfig {
  id: string;
  publishEnabled: boolean;
  pillars: PillarConfig[];
  themeBrandRatio: number;
  updatedAt: string;
}

export interface BatchGenerationResult {
  success: boolean;
  generated: number;
  failed: number;
  items: ShadowFeedQueueItem[];
}

export const PILLARS: ShadowFeedPillar[] = [
  {
    id: 'wake-up-slap',
    name: 'TAPA NA CARA',
    time: '09:00',
    active: true,
    contentType: 'controversy/opinion',
    slides: { min: 5, max: 8 },
    discoveryRatio: 0.2,
  },
  {
    id: 'proof-of-machine',
    name: 'PROVA DA MÁQUINA',
    time: '13:00',
    active: true,
    contentType: 'authority',
    slides: { min: 7, max: 10 },
    discoveryRatio: 0,
  },
  {
    id: 'shadow-school',
    name: 'ESCOLA SHADOW',
    time: '17:00',
    active: true,
    contentType: 'educational',
    slides: { min: 8, max: 12 },
    discoveryRatio: 0.7,
  },
  {
    id: 'the-offer',
    name: 'A OFERTA',
    time: '20:00',
    active: true,
    contentType: 'sales',
    slides: { min: 5, max: 8 },
    discoveryRatio: 0.5,
  },
];
