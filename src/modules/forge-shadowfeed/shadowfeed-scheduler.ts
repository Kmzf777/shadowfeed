/**
 * ShadowFeedScheduler — Story 3.9 / FS-09
 *
 * Checks sf_shadowfeed_queue for approved posts due now (BRT timezone)
 * and triggers the publisher sequentially with anti-detection delays.
 *
 * AC2  — queries approved items for today/now in BRT
 * AC3  — processes sequentially with 30-60s delay
 * AC8  — timezone from SHADOWFEED_TIMEZONE env
 * AC9  — status transitions: approved → posting → posted | failed
 * AC10 — atomic claimItem prevents double-posting
 */

import { supabase } from '../../config/supabase.js';
import { env } from '../../config/env.js';
import type { PillarId, QueueStatus, ShadowFeedQueueItem } from './forge-shadowfeed.types.js';
import { shadowFeedPublisherService } from '../shadowfeed-publisher/shadowfeed-publisher.service.js';

export interface SchedulerResult {
  published: number;
  failed: number;
}

interface QueueRow {
  id: string;
  pillar_id: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  post_id: string | null;
  theme_used: string;
  discovery_source: unknown;
  template_used: string | null;
  generation_time_ms: number | null;
  error_message: string | null;
}

export class ShadowFeedScheduler {
  /**
   * Called by webhook — check queue and publish due posts.
   * Returns count of published and failed items.
   */
  async checkAndPublish(): Promise<SchedulerResult> {
    const items = await this.getDueItems();
    let published = 0;
    let failed = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      // AC10: Atomic claim — approved → posting before invoking publisher
      const claimed = await this.claimItem(item.id);
      if (!claimed) {
        // Already claimed by another concurrent webhook invocation — skip
        continue;
      }

      try {
        // AC9: publisher handles posting → posted/failed transitions internally
        await shadowFeedPublisherService.publishPost(item.id);
        published++;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[ShadowFeedScheduler] Failed to publish item ${item.id}: ${message}`);
        failed++;
      }

      // AC3: wait 30-60s between posts (anti-detection), skip after last item
      if (i < items.length - 1) {
        await this.sleep(30_000 + Math.random() * 30_000);
      }
    }

    return { published, failed };
  }

  /**
   * Query for items due for publishing (AC2, AC8):
   *   status = 'approved'
   *   scheduled_date = today in SHADOWFEED_TIMEZONE
   *   scheduled_time <= current time in SHADOWFEED_TIMEZONE
   */
  async getDueItems(): Promise<ShadowFeedQueueItem[]> {
    const timezone = env.SHADOWFEED_TIMEZONE; // 'America/Sao_Paulo'
    const now = new Date();

    // en-CA gives YYYY-MM-DD; en-GB with hour12:false gives HH:MM:SS
    const brtDateStr = now.toLocaleDateString('en-CA', { timeZone: timezone });
    const brtTimeStr = now.toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const { data, error } = await supabase
      .from('sf_shadowfeed_queue')
      .select('*')
      .eq('status', 'approved')
      .eq('scheduled_date', brtDateStr)
      .lte('scheduled_time', brtTimeStr)
      .order('scheduled_time', { ascending: true });

    if (error) {
      throw new Error(`[ShadowFeedScheduler] Failed to fetch due items: ${error.message}`);
    }

    return ((data as QueueRow[]) ?? []).map((row) => this.mapRow(row));
  }

  /**
   * AC10: Atomic claim — updates status from 'approved' → 'posting' using
   * conditional WHERE clause. Returns true only if this call claimed the item
   * (no rows updated means another invocation already claimed it).
   */
  async claimItem(id: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('sf_shadowfeed_queue')
      .update({ status: 'posting', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'approved')
      .select('id');

    if (error) {
      console.error(`[ShadowFeedScheduler] Failed to claim item ${id}: ${error.message}`);
      return false;
    }

    return Array.isArray(data) && data.length > 0;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private mapRow(row: QueueRow): ShadowFeedQueueItem {
    return {
      id: row.id,
      pillarId: row.pillar_id as PillarId,
      scheduledDate: row.scheduled_date,
      scheduledTime: row.scheduled_time,
      status: row.status as QueueStatus,
      postId: row.post_id,
      themeUsed: row.theme_used,
      discoverySource: row.discovery_source as ShadowFeedQueueItem['discoverySource'],
      templateUsed: row.template_used,
      generationTimeMs: row.generation_time_ms,
      errorMessage: row.error_message,
    };
  }
}

export const shadowFeedScheduler = new ShadowFeedScheduler();
