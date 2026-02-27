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
      const createBtn = page.locator('svg[aria-label="New post"], svg[aria-label="Create"]').locator('..').first();
      // Fallback if SVG strategy doesn't work
      const fallbackCreateBtn = page.getByRole('link', { name: /create|new post/i });

      if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await createBtn.click();
      } else {
        await fallbackCreateBtn.click();
      }

      await humanDelay(1000, 2000);

      // Click "Post" option if a dropdown menu appears
      const postOption = page.locator('span').filter({ hasText: /^Post$/i }).first();
      if (await postOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await postOption.click();
        await humanDelay(1000, 2000);
      }

      // Wait for the file chooser BEFORE clicking the button that triggers it
      const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 15000 });

      // Click the "Select from computer" button
      const selectFromComputerBtn = page.getByRole('button', { name: /select from computer/i });
      await selectFromComputerBtn.waitFor({ state: 'visible', timeout: 10000 });
      await selectFromComputerBtn.click();

      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(slides);
      await humanDelay(2000, 3000);

      // Next buttons sequence (Crop -> Filter -> Share)

      // 1. Crop screen -> Set 4:5 ratio -> Next

      // Click the aspect ratio button (icon button in the bottom left of the crop preview)
      const selectCropBtn = page.getByRole('button', { name: /Select crop|Selecionar corte|Crop/i }).first();
      const fallbackCropBtn = page.locator('svg[aria-label="Select crop"], svg[aria-label="Selecionar corte"]').locator('..').first();
      // Also try the aspect ratio icon which is a common SVG near the bottom-left
      const aspectRatioIcon = page.locator('svg[aria-label="Select aspect ratio"], svg[aria-label="Selecionar proporção"]').locator('..').first();

      if (await selectCropBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await selectCropBtn.click();
      } else if (await fallbackCropBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fallbackCropBtn.click();
      } else if (await aspectRatioIcon.isVisible({ timeout: 3000 }).catch(() => false)) {
        await aspectRatioIcon.click();
      }

      await humanDelay(500, 1000);

      // Click the 4:5 option — Instagram uses various element types (div, span, button)
      // so we use a generic text-based locator that matches any clickable element
      const ratio45 = page.locator('text="4:5"').first();
      // Fallback: find any element containing exactly "4:5" text
      const fallbackRatio45 = page.locator('[role="button"] >> text="4:5"').first();
      // Last resort: xpath for any element with 4:5 text
      const xpathRatio45 = page.locator('//*[contains(text(),"4:5")]').first();

      if (await ratio45.isVisible({ timeout: 5000 }).catch(() => false)) {
        await ratio45.click();
        await humanDelay(1000, 2000);
      } else if (await fallbackRatio45.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fallbackRatio45.click();
        await humanDelay(1000, 2000);
      } else if (await xpathRatio45.isVisible({ timeout: 3000 }).catch(() => false)) {
        await xpathRatio45.click();
        await humanDelay(1000, 2000);
      } else {
        console.warn('Could not find 4:5 aspect ratio button, post may use default ratio');
      }

      let nextBtn = page.getByRole('button', { name: /Next|Avançar/i }).first();
      await nextBtn.waitFor({ state: 'visible', timeout: 15000 });
      await nextBtn.click();
      await humanDelay(1500, 2500);

      // 2. Filter screen -> Next
      nextBtn = page.getByRole('button', { name: /Next/i }).first();
      await nextBtn.waitFor({ state: 'visible', timeout: 15000 });
      await nextBtn.click();
      await humanDelay(1500, 2500);

      // 3. Caption screen
      const captionArea = page.getByRole('textbox', { name: /Write a caption|Escreva uma legenda|Caption/i }).first();
      await captionArea.waitFor({ state: 'visible', timeout: 15000 });
      await captionArea.click();
      await page.keyboard.type(caption, { delay: 30 });
      await humanDelay(1000, 2000);

      // Attempt to add recommended music
      try {
        // Look for the "Add music" or "Music" section toggle
        const addMusicToggle = page.locator('span', { hasText: /Add music|Adicionar música|Music/i }).first();
        if (await addMusicToggle.isVisible({ timeout: 3000 })) {
          await addMusicToggle.click();
          await humanDelay(1000, 2000);

          // Once expanded, wait for songs to load
          const firstSong = page.getByRole('button').filter({ hasText: /Trending|Em alta|Recommended|Recomendado|Play/i }).first();
          // Or just grabbing the first track from the list if it has a generic button
          const songItem = page.locator('button').filter({ has: page.locator('svg[aria-label="Play"], svg[aria-label="Reproduzir"]') }).first();

          if (await songItem.isVisible({ timeout: 5000 }).catch(() => false)) {
            await songItem.click();
            await humanDelay(1500, 2500);
          } else if (await firstSong.isVisible({ timeout: 3000 }).catch(() => false)) {
            await firstSong.click();
            await humanDelay(1500, 2500);
          }
        }
      } catch (e) {
        console.warn('Failed to add music, proceeding without it', e);
      }

      // Share the post
      const shareBtn = page.getByRole('button', { name: /Share|Compartilhar/i }).first();
      await shareBtn.waitFor({ state: 'visible', timeout: 10000 });
      await shareBtn.click();

      // Wait for success
      const successText = page.getByText(/Your post has been shared|Sua publicação foi compartilhada/i);
      await successText.waitFor({ state: 'visible', timeout: 30000 });
      await humanDelay(2000, 3000);
    } finally {
      await page.close();
    }
  }
}

export const instagramPoster = new InstagramPoster();
