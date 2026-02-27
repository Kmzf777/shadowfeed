import { supabase } from '../../config/supabase.js';
import { logger } from '../../config/logger.js';
import { PILLARS } from './forge-shadowfeed.types.js';
import { runDiscoveryPipeline } from './discovery/shadowfeed-discovery.service.js';
import { generateShadowFeedCarousel } from './shadowfeed-prompt-builder.js';
import type { PromptSource } from './shadowfeed-prompt-builder.js';
import {
  selectTemplate,
  recordTemplateUse,
  rotateTheme,
} from './template-rotation.js';
import type { PillarRotationState, ThemeRotationState } from './template-rotation.js';
import { educationalValueTemplates } from './pillar-templates/educational-value.templates.js';
import { wakeUpSlapTemplates } from './pillar-templates/wake-up-slap.templates.js';
import { brandBreakdownTemplates } from './pillar-templates/brand-breakdown.templates.js';
import { proofSocialTemplates } from './pillar-templates/proof-social.templates.js';
import { theOfferTemplates } from './pillar-templates/the-offer.templates.js';
import type {
  BatchGenerationResult,
  DiscoverySource,
  HookArchetype,
  PillarId,
  PillarTemplate,
  ShadowFeedConfig,
  ShadowFeedQueueItem,
  LlmProvider,
} from './forge-shadowfeed.types.js';
import {
  selectHookArchetype,
  getRecentHookArchetypes,
  getHookArchetypeStats,
} from './shadowfeed-hook-archetypes.js';
import { getFunnelTier } from './shadowfeed-double-door.js';
import {
  getTodayCadence,
  getWeeklyCadence,
  getCadenceForDate,
  getWeekStart,
  LIGHT_CONTENT_SLIDES,
} from './shadowfeed-weekly-cadence.js';
import type { CadenceEntry } from './shadowfeed-weekly-cadence.js';

// ── Template map per pillar ───────────────────────────────────────────────────

const PILLAR_TEMPLATES: Record<PillarId, PillarTemplate[]> = {
  'educational-value': educationalValueTemplates,
  'wake-up-slap': wakeUpSlapTemplates,
  'brand-breakdown': brandBreakdownTemplates,
  'proof-social': proofSocialTemplates,
  'the-offer': theOfferTemplates,
};

// ── In-memory rotation state (resets on server restart) ──────────────────────

const rotationStates: Record<PillarId, PillarRotationState> = {
  'educational-value': { pillarId: 'educational-value', history: [] },
  'wake-up-slap': { pillarId: 'wake-up-slap', history: [] },
  'brand-breakdown': { pillarId: 'brand-breakdown', history: [] },
  'proof-social': { pillarId: 'proof-social', history: [] },
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
    funnelTier: (row.funnel_tier as ShadowFeedQueueItem['funnelTier']) ?? null,
    doubleDoorSeed: (row.double_door_seed as ShadowFeedQueueItem['doubleDoorSeed']) ?? null,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapConfigRow(row: any): ShadowFeedConfig {
  return {
    id: row.id as string,
    publishEnabled: row.publish_enabled as boolean,
    pillars: row.pillars as ShadowFeedConfig['pillars'],
    themeBrandRatio: row.theme_brand_ratio as number,
    llmProvider: (row.llm_provider as LlmProvider | null) ?? 'openai',
    updatedAt: row.updated_at as string,
  };
}

function buildDefaultConfig(): Omit<ShadowFeedConfig, 'id' | 'updatedAt'> {
  return {
    publishEnabled: false,
    pillars: PILLARS.map((p) => ({
      id: p.id,
      proportion: p.proportion,
      time: p.time,
      active: p.active,
      contentType: p.contentType,
      slides: p.slides,
      discoveryRatio: p.discoveryRatio,
    })),
    themeBrandRatio: 0.7,
    llmProvider: 'openai',
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
      const result = await runDiscoveryPipeline(pillarId);

      if (result.success) {
        // Full research digest available — use enriched research source
        discoverySource = result.discoverySource;
        source = { type: 'research', data: result.digest };
      } else if (result.discoverySource) {
        // Scoring succeeded but scrape/summarize failed — use discovery-only source
        discoverySource = result.discoverySource;
        source = { type: 'discovery', data: result.discoverySource };
        logger.info(
          { pillarId, reason: result.reason },
          '[SHADOWFEED:GEN] Discovery v2 partial — falling back to discovery-only source',
        );
      } else {
        // Full failure — fall back to template
        logger.info(
          { pillarId, reason: result.reason },
          '[SHADOWFEED:GEN] Discovery v2 failed — falling back to template',
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

    // ── Select hook archetype (FSD-04 + FSD-06 cadence boost) ──────────────

    const cadence = getCadenceForDate(new Date());
    const recentArchetypes = await getRecentHookArchetypes();
    const hookArchetype = selectHookArchetype(pillarId, recentArchetypes, cadence.preferredHookArchetypes);
    logger.info({ pillarId, hookArchetype, recentArchetypes, cadencePreferred: cadence.preferredHookArchetypes }, '[SHADOWFEED:GEN] Hook archetype selected');

    // ── Assign funnel tier (FSD-05) ─────────────────────────────────────────

    const funnelTier = getFunnelTier(pillarId);

    // ── Generate carousel ───────────────────────────────────────────────────

    const llmProvider = config?.llmProvider ?? 'openai';
    const slideRangeOverride = cadence.isLightContent ? LIGHT_CONTENT_SLIDES : undefined;
    const genResult = await generateShadowFeedCarousel(pillarId, source, themeId, llmProvider, hookArchetype, slideRangeOverride);
    const generationTimeMs = Date.now() - startTime;

    // ── Double-door seed metadata (FSD-05) ────────────────────────────────

    const doubleDoorSeedData = genResult.doubleDoorSeed
      ? {
          seedText: genResult.doubleDoorSeed.seedText,
          placement: genResult.doubleDoorSeed.placement,
          intensity: genResult.doubleDoorSeed.intensity,
        }
      : null;

    // ── Save to sf_posts ────────────────────────────────────────────────────
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const themed = genResult.themeApplied as any;

    const { data: post, error: postError } = await supabase
      .from('sf_posts')
      .insert({
        user_id: null,
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
        hook_archetype: hookArchetype,
        funnel_tier: funnelTier,
        double_door_seed: doubleDoorSeedData,
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
      .upsert({
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
        hook_archetype: hookArchetype,
        funnel_tier: funnelTier,
        double_door_seed: doubleDoorSeedData,
      }, { onConflict: 'pillar_id, scheduled_date' })
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
        funnelTier,
        doubleDoorSeed: doubleDoorSeedData ? 'yes' : 'no',
      },
      '[SHADOWFEED:GEN] Pillar generated successfully',
    );

    return mapQueueRow(queueItem);
  }

  // ── generateBatch (v2 — cadence-based, 1 post/day) ─────────────────────────

  async generateBatch(pillarIdOverride?: PillarId): Promise<BatchGenerationResult> {
    const cadence = getTodayCadence();
    const effectivePillarId = pillarIdOverride ?? cadence.pillarId;

    logger.info(
      {
        dayName: cadence.dayName,
        pillarId: effectivePillarId,
        funnelTier: cadence.funnelTier,
        isOverride: !!pillarIdOverride,
      },
      '[SHADOWFEED:BATCH] Cadence-based generation — today\'s pillar',
    );

    const items: ShadowFeedQueueItem[] = [];
    let generated = 0;
    let failed = 0;

    try {
      const item = await this.generatePillar(effectivePillarId);
      items.push(item);
      generated++;

      // Record cadence history — uses the actual pillar generated (even if overridden)
      await this.recordCadenceHistory({ ...cadence, pillarId: effectivePillarId }, item.id);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      logger.error(
        { pillarId: effectivePillarId, error: msg },
        '[SHADOWFEED:BATCH] Cadence pillar generation failed',
      );
      failed++;

      const pillar = PILLARS.find((p) => p.id === effectivePillarId);
      const { data: failedItem } = await supabase
        .from('sf_shadowfeed_queue')
        .upsert({
          pillar_id: effectivePillarId,
          scheduled_date: getNextDayDate(),
          scheduled_time: pillar?.time ?? '09:00',
          status: 'failed',
          post_id: null,
          theme_used: '',
          discovery_source: null,
          template_used: null,
          generation_time_ms: null,
          error_message: msg,
        }, { onConflict: 'pillar_id, scheduled_date' })
        .select()
        .single()
        .then((r) => r.data);

      if (failedItem) {
        items.push(mapQueueRow(failedItem));
      }
    }

    logger.info(
      { generated, failed, pillarId: effectivePillarId },
      '[SHADOWFEED:BATCH] Cadence batch complete',
    );

    return { success: failed === 0, generated, failed, items };
  }

  // ── recordCadenceHistory ─────────────────────────────────────────────────

  private async recordCadenceHistory(
    cadence: CadenceEntry,
    queueItemId: string,
  ): Promise<void> {
    const weekStart = getWeekStart();
    const dayOfWeek = cadence.dayOfWeek;

    // Fetch the hook archetype from the queue item
    const { data: queueItem } = await supabase
      .from('sf_shadowfeed_queue')
      .select('hook_archetype')
      .eq('id', queueItemId)
      .single();

    const { error } = await supabase
      .from('sf_shadowfeed_cadence')
      .upsert({
        week_start: weekStart,
        day_of_week: dayOfWeek,
        pillar_id: cadence.pillarId,
        hook_archetype: (queueItem as { hook_archetype: string | null } | null)?.hook_archetype ?? null,
        funnel_tier: cadence.funnelTier,
        queue_item_id: queueItemId,
      }, { onConflict: 'week_start, day_of_week' });

    if (error) {
      logger.warn(
        { error: error.message, weekStart, dayOfWeek },
        '[SHADOWFEED:CADENCE] Failed to record cadence history',
      );
    }
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
    if (config.llmProvider !== undefined) payload.llm_provider = config.llmProvider;

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
          llm_provider: payload.llm_provider ?? defaults.llmProvider,
          updated_at: payload.updated_at,
        })
        .select()
        .single();

      if (error) throw new Error(`[SHADOWFEED:CONFIG] Insert failed: ${error.message}`);
      result = data;
    }

    return mapConfigRow(result);
  }

  // ── Hook Archetypes (FSD-04) ─────────────────────────────────────────────

  async getHookArchetypes() {
    return getHookArchetypeStats();
  }

  // ── Cadence (FSD-06) ──────────────────────────────────────────────────────

  getCadence() {
    const today = getTodayCadence();
    const week = getWeeklyCadence();
    return { today, week };
  }

  getCadenceToday() {
    return getTodayCadence();
  }

  // ── Stats ─────────────────────────────────────────────────────────────────

  async getStats() {
    const today = getTodayDate();
    const sevenDaysAgo = getDateDaysAgo(7);
    const thirtyDaysAgo = getDateDaysAgo(30);

    const [todayResult, totalResult, timingsResult, last7Result, last30Result] = await Promise.all([
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
      supabase
        .from('sf_shadowfeed_queue')
        .select('pillar_id, hook_archetype, funnel_tier, scheduled_date')
        .gte('scheduled_date', thirtyDaysAgo)
        .neq('status', 'failed'),
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

    // ── Breakdown stats (last 30 days) ────────────────────────────────────

    const last30Items = (last30Result.data ?? []) as Array<{
      pillar_id: string;
      hook_archetype: string | null;
      funnel_tier: string | null;
      scheduled_date: string;
    }>;

    // Pillar distribution
    const pillarDistribution: Record<string, number> = {};
    for (const item of last30Items) {
      pillarDistribution[item.pillar_id] = (pillarDistribution[item.pillar_id] ?? 0) + 1;
    }

    // Hook archetype distribution
    const archetypeDistribution: Record<string, number> = {};
    for (const item of last30Items) {
      if (item.hook_archetype) {
        archetypeDistribution[item.hook_archetype] = (archetypeDistribution[item.hook_archetype] ?? 0) + 1;
      }
    }

    // Funnel tier distribution (percentages)
    const funnelCounts: Record<string, number> = { top: 0, middle: 0, bottom: 0 };
    for (const item of last30Items) {
      if (item.funnel_tier && item.funnel_tier in funnelCounts) {
        funnelCounts[item.funnel_tier]++;
      }
    }
    const funnelTotal = last30Items.length || 1;
    const funnelDistribution = {
      top: parseFloat((funnelCounts.top / funnelTotal * 100).toFixed(1)),
      middle: parseFloat((funnelCounts.middle / funnelTotal * 100).toFixed(1)),
      bottom: parseFloat((funnelCounts.bottom / funnelTotal * 100).toFixed(1)),
    };

    // Cadence compliance rate (% posts matching day-of-week plan)
    let cadenceMatch = 0;
    for (const item of last30Items) {
      const date = new Date(item.scheduled_date + 'T00:00:00');
      const expectedCadence = getCadenceForDate(date);
      if (item.pillar_id === expectedCadence.pillarId) {
        cadenceMatch++;
      }
    }
    const cadenceComplianceRate =
      last30Items.length > 0
        ? parseFloat((cadenceMatch / last30Items.length * 100).toFixed(1))
        : 0;

    return {
      postsToday,
      totalPosts,
      avgGenerationTimeMs,
      failureRateLast7Days,
      pillarDistribution,
      archetypeDistribution,
      funnelDistribution,
      cadenceComplianceRate,
    };
  }
}

export const forgeShadowFeedService = new ForgeShadowFeedService();
