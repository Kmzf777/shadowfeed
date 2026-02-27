import type { UserOffer } from '../../shared/types/post-themes.types.js';
import type { PillarId } from '../../shared/types/pillar.types.js';

export interface ForgePersonalizedRequest {
  url?: string;
  title?: string;
  summary?: string;
  rawContent?: string;
  category?: string;
  themeId: string;
  userId: string;
  pillarId?: PillarId;
  productMode?: boolean;
  offer?: UserOffer;
  modelConfigId?: string;
}

export interface ForgePersonalizedBatchRequest {
  count: number;
  themeId: string;
  userId: string;
}

