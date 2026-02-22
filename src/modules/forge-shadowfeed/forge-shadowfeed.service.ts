import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { PILLARS } from './forge-shadowfeed.types.js';
import { generateShadowFeedQueries } from './shadowfeed-query-generator.js';
import { fetchShadowFeedCandidates } from './shadowfeed-content-fetcher.js';
import { scoreShadowFeedCandidates, toDiscoverySource } from './shadowfeed-content-scorer.js';
import { generateShadowFeedCarousel } from './shadowfeed-prompt-builder.js';
import type { PromptSource } from './shadowfeed-prompt-builder.js';
import {
  selectTemplate,
  recordTemplateUse,
  rotateTheme,
} from './template-rotation.js';
import type { PillarRotationState, ThemeRotationState } from './template-rotation.js';
import { wakeUpSlapTemplates } from './pillar-templates/wake-up-slap.templates.js';
import { proofOfMachineTemplates } from './pillar-templates/proof-of-machine.templates.js';
import { shadowSchoolTemplates } from './pillar-templates/shadow-school.templates.js';
import { theOfferTemplates } from './pillar-templates/the-offer.templates.js';
import type {
  BatchGenerationResult,
  DiscoverySource,
  PillarId,
  PillarTemplate,
  ShadowFeedConfig,
  ShadowFeedQueueItem,
} from './forge-shadowfeed.types.js';

// ── Template map per pillar ───────────────────────────────────────────────────

const PILLAR_TEMPLATES: Record<PillarId, PillarTemplate[]> = {
  'wake-up-slap': wakeUpSlapTemplates,
  'proof-of-machine': proofOfMachineTemplates,
  'shadow-school': shadowSchoolTemplates,
  'the-offer': theOfferTemplates,
};

// ── In-memory rotation state (resets on server restart) ──────────────────────

const rotationStates: Record<PillarId, PillarRotationState> = {
  'wake-up-slap': { pillarId: 'wake-up-slap', history: [] },
  'proof-of-machine': { pillarId: 'proof-of-machine', history: [] },
  'shadow-school': { pillarId: 'shadow-school', history: [] },
  'the-offer': { pillarId: 'the-offer', history: [] },
};

let themeRotationState: ThemeRotationState = { recentSources: [] };

// ── Date helpers ──────────────────────────────────────────────────────────────

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function getNextDayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function getDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

// ── Row mappers ───────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapQueueRow(row: any): ShadowFeedQueueItem {
  return {
    id: row.id as string,
    pillarId: row.pillar_id as PillarId,
    scheduledDate: row.scheduled_date as string,
    scheduledTime: row.scheduled_time as string,
    status: row.status as ShadowFeedQueueItem['status'],
    postId: (row.post_id as string | null) ?? null,
    themeUsed: (row.theme_used as string) ?? '',
    discoverySource: (row.discovery_source as DiscoverySource | null) ?? null,
    templateUsed: (row.template_used as string | null) ?? null,
    generationTimeMs: (row.generation_time_ms as number | null) ?? null,
    errorMessage: (row.error_message as string | null) ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapConfigRow(row: any): ShadowFeedConfig {
  return {
    id: row.id as string,
    publishEnabled: row.publish_enabled as boolean,
    pillars: row.pillars as ShadowFeedConfig['pillars'],
    themeBrandRatio: row.theme_brand_ratio as number,
    updatedAt: row.updated_at as string,
  };
}

function buildDefaultConfig(): Omit<ShadowFeedConfig, 'id' | 'updatedAt'> {
  return {
    publishEnabled: false,
    pillars: PILLARS.map((p) => ({
      id: p.id,
      time: p.time,
      active: p.active,
      contentType: p.contentType,
      slides: p.slides,
      discoveryRatio: p.discoveryRatio,
    })),
    themeBrandRatio: 0.7,
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

export class ForgeShadowFeedService {
  // ── generatePillar ───────────────────────────────────────────────────────────

  async generatePillar(pillarId: PillarId): Promise<ShadowFeedQueueItem> {
    const startTime = Date.now();

    const pillar = PILLARS.find((p) => p.id === pillarId);
    if (!pillar) throw new Error(`Unknown pillar: ${pillarId}`);

    const config = await this.getConfig().catch(() => null);
    const publishEnabled = config?.publishEnabled ?? false;

    logger.info({ pillarId }, '[SHADOWFEED:GEN] Starting pillar generation');

    // ── Determine source: discovery vs template ─────────────────────────────

    let source: PromptSource;
    let discoverySource: DiscoverySource | null = null;
    let templateUsed: string | null = null;

    const useDiscovery = pillar.discoveryRatio > 0 && Math.random() < pillar.discoveryRatio;

    if (useDiscovery) {
      const { data: recentPosts } = await supabase
        .from('sf_posts')
        .select('theme')
        .eq('generation_method', 'shadowfeed')
        .order('created_at', { ascending: false })
        .limit(30);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const lastPostsHistory = (recentPosts ?? []).map((p: any) => p.theme as string).filter(Boolean);

      const queries = await generateShadowFeedQueries({
        pillarId,
        date: getTodayDate(),
        lastPostsHistory,
      });

      const candidates = await fetchShadowFeedCandidates(queries, pillarId);
      const winner = scoreShadowFeedCandidates(candidates);

      if (winner) {
        discoverySource = toDiscoverySource(winner);
        source = { type: 'discovery', data: discoverySource };
      } else {
        logger.info(
          { pillarId },
          '[SHADOWFEED:GEN] Discovery returned no winner — falling back to template',
        );
        const template = selectTemplate(PILLAR_TEMPLATES[pillarId], rotationStates[pillarId]);
        rotationStates[pillarId] = recordTemplateUse(rotationStates[pillarId], template.id);
        templateUsed = template.id;
        source = { type: 'template', data: template };
      }
    } else {
      const template = selectTemplate(PILLAR_TEMPLATES[pillarId], rotationStates[pillarId]);
      rotationStates[pillarId] = recordTemplateUse(rotationStates[pillarId], template.id);
      templateUsed = template.id;
      source = { type: 'template', data: template };
    }

    // ── Select theme via rotation ───────────────────────────────────────────

    const { theme: themeId, updatedState } = rotateTheme(themeRotationState);
    themeRotationState = updatedState;

    // ── Generate carousel ───────────────────────────────────────────────────

    const genResult = await generateShadowFeedCarousel(pillarId, source, themeId);
    const generationTimeMs = Date.now() - startTime;

    // ── Save to sf_posts ────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const themed = genResult.themeApplied as any;

    const { data: post, error: postError } = await supabase
      .from('sf_posts')
      .insert({
        user_id: null,
        title: genResult.carousel.theme,
        theme: genResult.carousel.theme,
        style: themed.style ?? themeId,
        slides: themed.slides ?? genResult.carousel.slides,
        slide_count: genResult.carousel.total_slides,
        caption: genResult.carousel.caption,
        hashtags: genResult.carousel.hashtags,
        cta_text: genResult.carousel.cta_text,
        posting_time: genResult.carousel.best_posting_time,
        color_palette: themed.color_palette ?? null,
        fonts: themed.fonts ?? null,
        generation_method: 'shadowfeed',
        generation_time_ms: generationTimeMs,
        status: 'draft',
        content_json: genResult.carousel,
        prompt_version: 'shadowfeed-v1',
      })
      .select('id')
      .single();

    if (postError) {
      throw new Error(`[SHADOWFEED:GEN] Post insert failed: ${postError.message}`);
    }

    // ── Create queue item ───────────────────────────────────────────────────

    const queueStatus: ShadowFeedQueueItem['status'] = publishEnabled ? 'approved' : 'ready';

    const { data: queueItem, error: queueError } = await supabase
      .from('sf_shadowfeed_queue')
      .insert({
        pillar_id: pillarId,
        scheduled_date: getNextDayDate(),
        scheduled_time: pillar.time,
        status: queueStatus,
        post_id: post.id,
        theme_used: genResult.carousel.theme,
        discovery_source: discoverySource,
        template_used: templateUsed,
        generation_time_ms: generationTimeMs,
        error_message: null,
      })
      .select()
      .single();

    if (queueError) {
      throw new Error(`[SHADOWFEED:GEN] Queue insert failed: ${queueError.message}`);
    }

    logger.info(
      {
        pillarId,
        postId: post.id,
        queueId: (queueItem as { id: string }).id,
        status: queueStatus,
        timeMs: generationTimeMs,
      },
      '[SHADOWFEED:GEN] Pillar generated successfully',
    );

    return mapQueueRow(queueItem);
  }

  // ── generateBatch ─────────────────────────────────────────────────────────

  async generateBatch(): Promise<BatchGenerationResult> {
    const config = await this.getConfig().catch(() => null);
    const activePillars = (config?.pillars ?? PILLARS).filter((p) => p.active);

    const items: ShadowFeedQueueItem[] = [];
    let generated = 0;
    let failed = 0;

    for (const pillar of activePillars) {
      try {
        const item = await this.generatePillar(pillar.id as PillarId);
        items.push(item);
        generated++;
      } catch (error) {
        const msg = error instanceof Error ? error.message : 'Unknown error';
        logger.error(
          { pillarId: pillar.id, error: msg },
          '[SHADOWFEED:BATCH] Pillar generation failed',
        );
        failed++;

        // Record failed queue item so admin can see the error
        const { data: failedItem } = await supabase
          .from('sf_shadowfeed_queue')
          .insert({
            pillar_id: pillar.id,
            scheduled_date: getNextDayDate(),
            scheduled_time: pillar.time,
            status: 'failed',
            post_id: null,
            theme_used: '',
            discovery_source: null,
            template_used: null,
            generation_time_ms: null,
            error_message: msg,
          })
          .select()
          .single()
          .then((r) => r.data);

        if (failedItem) {
          items.push(mapQueueRow(failedItem));
        }
      }
    }

    logger.info(
      { generated, failed, total: activePillars.length },
      '[SHADOWFEED:BATCH] Batch generation complete',
    );

    return { success: failed === 0, generated, failed, items };
  }

  // ── Queue queries ──────────────────────────────────────────────────────────

  async getQueue(date?: string): Promise<ShadowFeedQueueItem[]> {
    const targetDate = date ?? getTodayDate();

    const { data, error } = await supabase
      .from('sf_shadowfeed_queue')
      .select('*')
      .eq('scheduled_date', targetDate)
      .order('scheduled_time', { ascending: true });

    if (error) throw new Error(`[SHADOWFEED:QUEUE] getQueue failed: ${error.message}`);

    return (data ?? []).map(mapQueueRow);
  }

  async getRecentPosts(): Promise<ShadowFeedQueueItem[]> {
    const sevenDaysAgo = getDateDaysAgo(7);

    const { data, error } = await supabase
      .from('sf_shadowfeed_queue')
      .select('*')
      .gte('scheduled_date', sevenDaysAgo)
      .order('scheduled_date', { ascending: false })
      .order('scheduled_time', { ascending: true });

    if (error) throw new Error(`[SHADOWFEED:QUEUE] getRecentPosts failed: ${error.message}`);

    return (data ?? []).map(mapQueueRow);
  }

  // ── Approval endpoints ────────────────────────────────────────────────────

  async approvePost(id: string): Promise<ShadowFeedQueueItem> {
    const { data, error } = await supabase
      .from('sf_shadowfeed_queue')
      .update({ status: 'approved' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`[SHADOWFEED:APPROVE] Failed: ${error.message}`);

    return mapQueueRow(data);
  }

  async updateCaption(id: string, caption: string): Promise<ShadowFeedQueueItem> {
    const { data: queueItem, error: queueError } = await supabase
      .from('sf_shadowfeed_queue')
      .select('*')
      .eq('id', id)
      .single();

    if (queueError || !queueItem) {
      throw new Error(
        `[SHADOWFEED:CAPTION] Queue item not found: ${queueError?.message ?? 'no data'}`,
      );
    }

    if (queueItem.post_id) {
      const { error: postError } = await supabase
        .from('sf_posts')
        .update({ caption })
        .eq('id', queueItem.post_id);

      if (postError) {
        throw new Error(`[SHADOWFEED:CAPTION] Post update failed: ${postError.message}`);
      }
    }

    return mapQueueRow(queueItem);
  }

  async publishNow(id: string): Promise<ShadowFeedQueueItem> {
    const { data: updated, error } = await supabase
      .from('sf_shadowfeed_queue')
      .update({ status: 'posting' })
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(`[SHADOWFEED:PUBLISH] Status update failed: ${error.message}`);

    try {
      const { shadowFeedPublisherService } = await import(
        '../shadowfeed-publisher/shadowfeed-publisher.service.js'
      );
      await shadowFeedPublisherService.publishPost(id);

      // Re-fetch to get latest status after publisher updates it
      const { data: latest } = await supabase
        .from('sf_shadowfeed_queue')
        .select('*')
        .eq('id', id)
        .single();

      return mapQueueRow(latest ?? updated);
    } catch (publishError) {
      logger.warn(
        { queueItemId: id, error: (publishError as Error).message },
        '[SHADOWFEED:PUBLISH] Publisher unavailable — reverting to approved',
      );

      const { data: reverted } = await supabase
        .from('sf_shadowfeed_queue')
        .update({ status: 'approved' })
        .eq('id', id)
        .select()
        .single();

      return mapQueueRow(reverted ?? updated);
    }
  }

  // ── Config ────────────────────────────────────────────────────────────────

  async getConfig(): Promise<ShadowFeedConfig> {
    const { data, error } = await supabase
      .from('sf_shadowfeed_config')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      logger.warn('[SHADOWFEED:CONFIG] No config found — returning defaults');
      return {
        id: 'default',
        ...buildDefaultConfig(),
        updatedAt: new Date().toISOString(),
      };
    }

    return mapConfigRow(data);
  }

  async updateConfig(config: Partial<ShadowFeedConfig>): Promise<ShadowFeedConfig> {
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (config.publishEnabled !== undefined) payload.publish_enabled = config.publishEnabled;
    if (config.pillars !== undefined) payload.pillars = config.pillars;
    if (config.themeBrandRatio !== undefined) payload.theme_brand_ratio = config.themeBrandRatio;

    const { data: existing } = await supabase
      .from('sf_shadowfeed_config')
      .select('id')
      .limit(1)
      .single();

    let result;

    if (existing) {
      const { data, error } = await supabase
        .from('sf_shadowfeed_config')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw new Error(`[SHADOWFEED:CONFIG] Update failed: ${error.message}`);
      result = data;
    } else {
      const defaults = buildDefaultConfig();
      const { data, error } = await supabase
        .from('sf_shadowfeed_config')
        .insert({
          publish_enabled: payload.publish_enabled ?? defaults.publishEnabled,
          pillars: payload.pillars ?? defaults.pillars,
          theme_brand_ratio: payload.theme_brand_ratio ?? defaults.themeBrandRatio,
          updated_at: payload.updated_at,
        })
        .select()
        .single();

      if (error) throw new Error(`[SHADOWFEED:CONFIG] Insert failed: ${error.message}`);
      result = data;
    }

    return mapConfigRow(result);
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats(): Promise<{
    postsToday: number;
    totalPosts: number;
    avgGenerationTimeMs: number | null;
    failureRateLast7Days: number;
  }> {
    const today = getTodayDate();
    const sevenDaysAgo = getDateDaysAgo(7);

    const [todayResult, totalResult, timingsResult, last7Result] = await Promise.all([
      supabase
        .from('sf_shadowfeed_queue')
        .select('*', { count: 'exact', head: true })
        .eq('scheduled_date', today)
        .neq('status', 'failed'),
      supabase
        .from('sf_shadowfeed_queue')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'failed'),
      supabase
        .from('sf_shadowfeed_queue')
        .select('generation_time_ms')
        .not('generation_time_ms', 'is', null),
      supabase
        .from('sf_shadowfeed_queue')
        .select('status')
        .gte('scheduled_date', sevenDaysAgo),
    ]);

    const postsToday = todayResult.count ?? 0;
    const totalPosts = totalResult.count ?? 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const timings = (timingsResult.data ?? []).map((r: any) => r.generation_time_ms as number);
    const avgGenerationTimeMs =
      timings.length > 0
        ? Math.round(timings.reduce((a, b) => a + b, 0) / timings.length)
        : null;

    const last7Items = last7Result.data ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const failedCount = last7Items.filter((r: any) => r.status === 'failed').length;
    const failureRateLast7Days =
      last7Items.length > 0
        ? parseFloat((failedCount / last7Items.length).toFixed(3))
        : 0;

    return { postsToday, totalPosts, avgGenerationTimeMs, failureRateLast7Days };
  }
}

export const forgeShadowFeedService = new ForgeShadowFeedService();
