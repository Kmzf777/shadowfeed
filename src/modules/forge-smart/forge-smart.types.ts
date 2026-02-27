// src/modules/forge-smart/forge-smart.types.ts

import type { UserOffer } from '../../shared/types/post-themes.types.js';
import type { PillarId, PillarConfig } from '../../shared/types/pillar.types.js';

export interface SmartQueryGeneratorInput {
  target_audience: string;
  main_pain_point: string;
  voice_tone: string;
  user_prompt?: string | null;
  niche?: string | null;
  pillarConfig: PillarConfig;
}

export interface SmartCandidate {
  source_type: 'google_news' | 'reddit' | 'twitter';
  title: string;
  summary: string | null;
  url: string | null;
  author: string | null;
  source_score: number | null;     // upvotes/likes da fonte
  source_comments: number | null;
  posted_at: string | null;        // ISO 8601 string ou null
  relevance_score: number;         // 0-10, calculado no fetch
  query_used: string;              // qual das queries gerou este item
  scraped_body?: string | null;
}

export interface SmartCandidateScored extends SmartCandidate {
  final_score: number;             // 0-10, resultado da fórmula de scoring
}

export interface ForgeSmartRequest {
  userId: string;
  themeId: string;
  pillarId: PillarId;
  modelConfigId?: string;
  productMode?: boolean;
  offer?: UserOffer;
}

export interface DiscoverRequest {
  userId: string;
  pillarId: PillarId;
}

export interface DiscoverCandidate {
  title: string;
  summary: string | null;
  url: string | null;
  source_type: SmartCandidate['source_type'];
  final_score: number;
  posted_at: string | null;
}

export interface DiscoverResponse {
  candidates: DiscoverCandidate[];
  queriesUsed: string[];
  pillarId: PillarId;
}

