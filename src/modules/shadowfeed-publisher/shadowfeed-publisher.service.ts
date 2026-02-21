import type { BrowserContext } from 'playwright';
import { supabase } from '../../config/supabase.js';
import type { ContentCarousel } from '../../shared/schemas/content-schema.js';
import { instagramSessionManager } from './instagram-session.manager.js';
import { instagramPoster } from './instagram-poster.js';

// ─── Types ───────────────────────────────────────────────────────────────────

interface QueueRow {
  id: string;
  post_id: string | null;
  status: string;
}

interface PostRow {
  id: string;
  content_json: ContentCarousel | null;
  caption: string | null;
}

// ─── ShadowFeedPublisherService ───────────────────────────────────────────────

export class ShadowFeedPublisherService {
  /**
   * Full orchestration: load queue item → validate session → download images
   * → post to Instagram → update queue status (posted/failed).
   *
   * On any error: queue status set to 'failed', browser closed cleanly.
   * No automatic retry — let admin investigate.
   */
  async publishPost(queueItemId: string): Promise<void> {
    let context: BrowserContext | null = null;

    try {
      // 1. Load queue item
      const { data: queueItem, error: queueError } = await supabase
        .from('sf_shadowfeed_queue')
        .select('id, post_id, status')
        .eq('id', queueItemId)
        .single<QueueRow>();

      if (queueError || !queueItem) {
        throw new Error(`Queue item ${queueItemId} not found: ${queueError?.message ?? 'no data'}`);
      }

      if (!queueItem.post_id) {
        throw new Error(`Queue item ${queueItemId} has no linked post_id`);
      }

      // 2. Load post data (slide image URLs + caption)
      const { data: post, error: postError } = await supabase
        .from('sf_posts')
        .select('id, content_json, caption')
        .eq('id', queueItem.post_id)
        .single<PostRow>();

      if (postError || !post) {
        throw new Error(`Post ${queueItem.post_id} not found: ${postError?.message ?? 'no data'}`);
      }

      if (!post.content_json) {
        throw new Error(`Post ${post.id} has no content_json`);
      }

      // 3. Check daily rate limit (max 4 posts/day — AC16)
      await this.checkDailyRateLimit();

      // 4. Validate session early — fail fast before downloading images
      const isValid = await instagramSessionManager.isSessionValid();
      if (!isValid) {
        throw new Error('Instagram session is invalid or expired. Refresh via /session/refresh.');
      }

      // 5. Collect slide image URLs (only slides with an image_url)
      const slideUrls = post.content_json.slides
        .filter((s) => s.image === true && typeof s.image_url === 'string')
        .map((s) => s.image_url as string);

      if (slideUrls.length === 0) {
        throw new Error(`Post ${post.id} has no slide images to upload`);
      }

      // 6. Download slide images to buffers
      const slideFiles = await instagramPoster.downloadSlides(slideUrls);

      // 7. Open Instagram session
      context = await instagramSessionManager.loadSession();

      // 8. Build caption: post caption + hashtags
      const caption = this.buildCaption(post, post.content_json);

      // 9. Post carousel to Instagram
      await instagramPoster.post(context, slideFiles, caption);

      // 10. Success: update queue status to 'posted'
      await this.updateQueueStatus(queueItemId, 'posted', null);
    } catch (error) {
      // Failure: update queue status to 'failed' with error message
      const message = error instanceof Error ? error.message : String(error);
      await this.updateQueueStatus(queueItemId, 'failed', message).catch(() => {
        // Swallow secondary error to preserve original
      });
      throw error;
    } finally {
      // Always close browser cleanly
      if (context) {
        await context.browser()?.close().catch(() => undefined);
      }
    }
  }

  /**
   * Checks if today's post count has reached the daily rate limit (max 4).
   * Throws if limit reached to prevent Instagram detection.
   */
  async checkDailyRateLimit(): Promise<void> {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const { count, error } = await supabase
      .from('sf_shadowfeed_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'posted')
      .eq('scheduled_date', today);

    if (error) {
      throw new Error(`Failed to check daily rate limit: ${error.message}`);
    }

    const MAX_DAILY_POSTS = 4;
    if ((count ?? 0) >= MAX_DAILY_POSTS) {
      throw new Error(
        `Daily rate limit reached: ${count}/${MAX_DAILY_POSTS} posts already published today`
      );
    }
  }

  // ─── Private helpers ────────────────────────────────────────────────────────

  private buildCaption(post: PostRow, content: ContentCarousel): string {
    const base = post.caption ?? content.caption;
    const hashtags = content.hashtags.join(' ');
    return `${base}\n\n${hashtags}`;
  }

  private async updateQueueStatus(
    id: string,
    status: 'posted' | 'failed',
    errorMessage: string | null
  ): Promise<void> {
    await supabase
      .from('sf_shadowfeed_queue')
      .update({
        status,
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
  }
}

export const shadowFeedPublisherService = new ShadowFeedPublisherService();
