import type {
  BatchGenerationResult,
  PillarId,
  ShadowFeedConfig,
  ShadowFeedQueueItem,
} from './forge-shadowfeed.types.js';

export class ForgeShadowFeedService {
  async generateBatch(): Promise<BatchGenerationResult> {
    throw new Error('Not implemented');
  }

  async generatePillar(_pillarId: PillarId): Promise<ShadowFeedQueueItem> {
    throw new Error('Not implemented');
  }

  async getQueue(_date?: string): Promise<ShadowFeedQueueItem[]> {
    throw new Error('Not implemented');
  }

  async getRecentPosts(): Promise<ShadowFeedQueueItem[]> {
    throw new Error('Not implemented');
  }

  async approvePost(_id: string): Promise<ShadowFeedQueueItem> {
    throw new Error('Not implemented');
  }

  async updateCaption(_id: string, _caption: string): Promise<ShadowFeedQueueItem> {
    throw new Error('Not implemented');
  }

  async publishNow(_id: string): Promise<ShadowFeedQueueItem> {
    throw new Error('Not implemented');
  }

  async getConfig(): Promise<ShadowFeedConfig> {
    throw new Error('Not implemented');
  }

  async updateConfig(_config: Partial<ShadowFeedConfig>): Promise<ShadowFeedConfig> {
    throw new Error('Not implemented');
  }
}

export const forgeShadowFeedService = new ForgeShadowFeedService();
