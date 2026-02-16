/**
 * Quick script to render the last post's CTA slide(s) so we can preview the avatar.
 * Usage: node scripts/preview-avatar.mjs
 */
import { createClient } from '@supabase/supabase-js';
import express from 'express';
import { createServer } from 'http';
import puppeteer from 'puppeteer';
import { join, dirname } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  // 1. Fetch latest post
  console.log('[PREVIEW] Fetching latest post from Supabase...');
  const { data: post, error } = await supabase
    .from('sf_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !post) {
    console.error('[PREVIEW] No post found:', error?.message);
    process.exit(1);
  }

  console.log(`[PREVIEW] Post: "${post.theme}" (id: ${post.id}, style: ${post.style}, status: ${post.status})`);
  console.log(`[PREVIEW] Slides: ${post.slide_count}`);

  const slides = post.slides;
  if (!slides || slides.length === 0) {
    console.error('[PREVIEW] Post has no slides');
    process.exit(1);
  }

  // 2. Build full JSON (same as render.service.ts)
  const fullJson = {
    theme: post.theme,
    style: post.style,
    total_slides: post.slide_count,
    color_palette: post.color_palette,
    fonts: post.fonts,
    branding: post.branding || { name: 'Vistra IA', handle: '@vistra.ai' },
    slides: slides,
    caption: post.caption,
    hashtags: post.hashtags,
    cta_text: post.cta_text,
    best_posting_time: post.posting_time,
  };

  // Include profile — use default with /avatar.png
  if (post.profile) {
    fullJson.profile = post.profile;
    // Ensure avatar_url points to our logo
    if (!fullJson.profile.avatar_url || fullJson.profile.avatar_url === '') {
      fullJson.profile.avatar_url = '/avatar.png';
    }
  } else {
    fullJson.profile = {
      display_name: 'Vistra IA',
      username: '@vistra.ai',
      avatar_url: '/avatar.png',
      verified: true,
    };
  }

  // 3. Start slide server
  console.log('[PREVIEW] Starting slide server on port 3001...');
  const app = express();
  const distPath = join(ROOT, 'renderer', 'dist');
  const publicPath = join(ROOT, 'renderer', 'public');
  app.use(express.static(publicPath));
  app.use(express.static(distPath));
  app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')));

  const server = createServer({ maxHeaderSize: 131072 }, app);
  await new Promise((resolve, reject) => {
    server.listen(3001, () => {
      console.log('[PREVIEW] Slide server ready');
      resolve();
    });
    server.on('error', reject);
  });

  // 4. Capture slides with Puppeteer
  const outputDir = join(ROOT, 'output', 'avatar-preview');
  await mkdir(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 2 });

  // Find slides with avatar (CTA, tweet-cta, profile-card, tweet-card, tweet-engagement)
  const avatarSlideIndices = [];
  for (let i = 0; i < slides.length; i++) {
    const s = slides[i];
    if (
      s.layout === 'tweet-cta' ||
      s.layout === 'tweet-card' ||
      s.layout === 'tweet-engagement' ||
      s.layout === 'profile-card' ||
      s.role === 'cta' ||
      i === 0 ||                        // hook
      i === slides.length - 1           // last slide
    ) {
      avatarSlideIndices.push(i);
    }
  }

  // If no specific avatar slides found, capture all
  if (avatarSlideIndices.length === 0) {
    for (let i = 0; i < slides.length; i++) avatarSlideIndices.push(i);
  }

  const paths = [];
  for (const idx of avatarSlideIndices) {
    const jsonPayload = Buffer.from(JSON.stringify(fullJson)).toString('base64url');
    const url = `http://localhost:3001/?data=${jsonPayload}&slide=${idx}`;

    console.log(`[PREVIEW] Capturing slide ${idx + 1}/${slides.length} (layout: ${slides[idx].layout}, role: ${slides[idx].role})...`);

    await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

    try {
      await page.waitForSelector('[data-slide-ready="true"]', { timeout: 10000 });
    } catch {
      console.warn(`[PREVIEW] Slide ${idx + 1} ready timeout, capturing anyway...`);
    }

    await page.evaluate(() => document.fonts.ready);
    await new Promise(r => setTimeout(r, 500));

    const filename = `slide-${String(idx + 1).padStart(2, '0')}.png`;
    const filepath = join(outputDir, filename);
    await page.screenshot({
      path: filepath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1080, height: 1350 },
    });
    paths.push(filepath);
    console.log(`[PREVIEW] Saved: ${filepath}`);
  }

  await browser.close();
  server.close();

  console.log(`\n[PREVIEW] Done! ${paths.length} slides saved to: ${outputDir}`);
  for (const p of paths) console.log(`  -> ${p}`);
}

main().catch(err => {
  console.error('[PREVIEW] Error:', err);
  process.exit(1);
});
