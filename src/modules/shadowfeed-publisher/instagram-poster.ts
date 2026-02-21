import type { BrowserContext } from 'playwright';
import { humanDelay, shortDelay } from '../../shared/utils/delay.js';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SlideFile {
  name: string;
  mimeType: string;
  buffer: Buffer;
}

// ─── InstagramPoster ─────────────────────────────────────────────────────────

export class InstagramPoster {
  /**
   * Downloads slide images from URLs to in-memory buffers.
   * Only downloads slides that have an image_url set.
   */
  async downloadSlides(urls: string[]): Promise<SlideFile[]> {
    const slides: SlideFile[] = [];

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Failed to download slide ${i + 1} from ${url}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') ?? 'image/jpeg';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const ext = contentType.includes('png') ? 'png' : 'jpg';

      slides.push({
        name: `slide-${i + 1}.${ext}`,
        mimeType: contentType,
        buffer,
      });
    }

    return slides;
  }

  /**
   * Navigates Instagram web app and publishes a carousel post.
   * Uses resilient selectors (aria-label, data-testid, visible text) —
   * never fragile CSS class selectors.
   *
   * Anti-detection: human-like delays, realistic viewport + user-agent (set
   * on the BrowserContext by InstagramSessionManager), random mouse scroll.
   */
  async post(context: BrowserContext, slides: SlideFile[], caption: string): Promise<void> {
    const page = await context.newPage();

    try {
      // Navigate to Instagram home
      await page.goto('https://www.instagram.com', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await humanDelay(2000, 4000);

      // Random scroll to look human
      await page.mouse.wheel(0, 200);
      await shortDelay(500, 1000);

      // Click the "Create" / "New post" button
      const createBtn = page.locator('[aria-label="New post"], [aria-label="Create"]').first();
      await createBtn.waitFor({ timeout: 15000 });
      await createBtn.click();
      await humanDelay(1000, 2000);

      // Click "Post" option if a menu appears
      const postOption = page.getByRole('button', { name: /^Post$/i });
      const hasPostOption = await postOption.isVisible({ timeout: 3000 }).catch(() => false);
      if (hasPostOption) {
        await postOption.click();
        await humanDelay(1000, 2000);
      }

      // Find the file input (may be hidden — Playwright can interact with hidden inputs)
      const fileInput = page.locator('input[type="file"]').first();
      await fileInput.waitFor({ timeout: 15000 });
      await fileInput.setInputFiles(slides);
      await humanDelay(2000, 3000);

      // If Instagram asks to select "original" crop / shows crop screen — click Next
      await this.clickNextIfPresent(page);
      await humanDelay(1000, 2000);

      // Filter screen — click Next
      await this.clickNextIfPresent(page);
      await humanDelay(1000, 2000);

      // Caption screen — locate textarea and type caption
      const captionArea = page
        .locator('[aria-label="Write a caption..."], [aria-label="Caption"], textarea')
        .first();
      await captionArea.waitFor({ timeout: 15000 });
      await captionArea.click();
      await shortDelay(300, 600);

      // Type caption with human-like pace
      await page.keyboard.type(caption, { delay: 30 });
      await humanDelay(1000, 2000);

      // Share the post
      const shareBtn = page
        .getByRole('button', { name: /^Share$|^Post$/i })
        .first();
      await shareBtn.waitFor({ timeout: 10000 });
      await shareBtn.click();

      // Wait for confirmation (URL change to profile or success notification)
      await page.waitForFunction(
        () =>
          document.querySelector('[aria-label="Post shared"], [role="alertdialog"]') !== null ||
          window.location.href.includes('/p/'),
        { timeout: 30000 }
      );

      await humanDelay(2000, 3000);
    } finally {
      await page.close();
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async clickNextIfPresent(page: import('playwright').Page): Promise<void> {
    const nextBtn = page.getByRole('button', { name: /^Next$/i }).first();
    const visible = await nextBtn.isVisible({ timeout: 3000 }).catch(() => false);
    if (visible) {
      await nextBtn.click();
    }
  }
}

export const instagramPoster = new InstagramPoster();
