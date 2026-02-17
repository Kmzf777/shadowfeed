import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { logger } from '../../config/logger.js';
import { env } from '../../config/env.js';

const VIEWPORT = {
  width: 1080,
  height: 1350,
  deviceScaleFactor: 2, // Retina: output real = 2160x2700
};

export async function captureSlides(
  postId: string,
  slides: unknown[],
  fullJson: Record<string, unknown>
): Promise<string[]> {
  const dateDir = new Date().toISOString().split('T')[0];
  const outputDir = join(env.OUTPUT_DIR, dateDir, postId);
  await mkdir(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const paths: string[] = [];

  try {
    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    // Capture browser console errors for debugging
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        logger.error({ text: msg.text() }, '[RENDER] Browser console error');
      }
    });
    page.on('pageerror', (err) => {
      logger.error({ message: err.message }, '[RENDER] Browser page error');
    });

    for (let i = 0; i < slides.length; i++) {
      const jsonPayload = Buffer.from(JSON.stringify(fullJson)).toString('base64url');
      const url = `${env.RENDERER_APP_URL}/?data=${jsonPayload}&slide=${i}`;

      logger.info({ slide: i + 1, urlLength: url.length }, '[RENDER] Loading slide URL');

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Wait for React app signal
      try {
        await page.waitForSelector('[data-slide-ready="true"]', { timeout: 15000 });
      } catch (waitErr) {
        // Log page content for debugging
        const readyAttr = await page.evaluate(() => {
          const el = document.querySelector('[data-slide-ready]');
          return el ? el.getAttribute('data-slide-ready') : 'element-not-found';
        });
        const bodyText = await page.evaluate(() => document.body.innerText.slice(0, 500));
        logger.error(
          { slide: i + 1, readyAttr, bodyText },
          '[RENDER] Slide ready timeout — debug info'
        );
        throw waitErr;
      }

      // Wait for fonts
      await page.evaluate(() => document.fonts.ready);

      // Small delay for final rendering
      await new Promise((r) => setTimeout(r, 300));

      const filename = `slide-${String(i + 1).padStart(2, '0')}.png`;
      const filepath = join(outputDir, filename);

      await page.screenshot({
        path: filepath,
        type: 'png',
        clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
      });

      paths.push(filepath);
      logger.info({ postId, slide: i + 1, path: filepath }, '[RENDER] Slide captured');
    }

    // Save metadata.json
    const metadataPath = join(outputDir, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify(fullJson, null, 2));
  } finally {
    await browser.close();
  }

  logger.info({ postId, totalSlides: paths.length, outputDir }, '[RENDER] All slides captured');
  return paths;
}
