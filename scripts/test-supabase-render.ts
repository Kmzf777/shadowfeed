/**
 * Test: Fetch Last Supabase Post → Render Carousel with Real Images
 *
 * Fetches the most recent post from sf_posts, maps images from
 * renderer/public/slides/ (e.g. 1.png, 3.png, 6.png, 7.png, 8.png),
 * builds the renderer, and captures all slides as PNGs.
 *
 * Usage:  npx tsx scripts/test-supabase-render.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import puppeteer from 'puppeteer';
import express from 'express';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';
import { existsSync, readdirSync } from 'fs';

// ── Supabase client ──────────────────────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

// ── Config ────────────────────────────────────────────────────────
const VIEWPORT = { width: 1080, height: 1350, deviceScaleFactor: 2 };
const RENDERER_PORT = 3003;
const OUTPUT_DIR = join(process.cwd(), 'output', 'test-supabase-render');
const SLIDES_DIR = join(process.cwd(), 'renderer', 'public', 'slides');

// ── Image detection ───────────────────────────────────────────────
function findImageFile(slideNumber: number): string | null {
    if (!existsSync(SLIDES_DIR)) return null;

    const extensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const files = readdirSync(SLIDES_DIR);

    for (const ext of extensions) {
        const filename = `${slideNumber}${ext}`;
        if (files.includes(filename)) {
            return `/slides/${filename}`;
        }
    }
    return null;
}

// ── Main ──────────────────────────────────────────────────────────
async function main() {
    console.log('🚀 ShadowFeed — Supabase → Render Test');
    console.log('━'.repeat(55));

    // 1. Fetch last post from Supabase
    console.log('\n📡 Fetching last post from sf_posts...');
    const { data: post, error } = await supabase
        .from('sf_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !post) {
        console.error('❌ Failed to fetch post:', error?.message || 'No posts found');
        process.exit(1);
    }

    console.log(`  ✅ Post found: id=${post.id}`);
    console.log(`     Theme: ${post.theme}`);
    console.log(`     Style: ${post.style}`);
    console.log(`     Slides: ${post.slide_count}`);
    console.log(`     Status: ${post.status}`);
    console.log(`     Created: ${post.created_at}`);

    // 2. Parse slides and map images
    const slides = post.slides as Record<string, unknown>[];
    if (!slides || slides.length === 0) {
        console.error('❌ Post has no slides');
        process.exit(1);
    }

    console.log(`\n🖼️  Scanning for images in: ${SLIDES_DIR}`);
    let imagesMapped = 0;

    const updatedSlides = slides.map((slide: any) => {
        const imageUrl = findImageFile(slide.slide);
        if (imageUrl) {
            imagesMapped++;
            console.log(`  ✅ Slide ${slide.slide}: ${imageUrl}`);
            return {
                ...slide,
                image: {
                    type: 'upload',
                    prompt: slide.image?.prompt || null,
                    url: imageUrl,
                },
            };
        } else {
            console.log(`  ⬜ Slide ${slide.slide}: no image (text-only)`);
            return slide;
        }
    });

    console.log(`  → ${imagesMapped} images mapped out of ${slides.length} slides`);

    // 3. Build full carousel JSON
    const fullJson = {
        theme: post.theme,
        style: post.style,
        total_slides: post.slide_count,
        color_palette: post.color_palette,
        fonts: post.fonts,
        branding: post.branding || { name: 'ShadowFeed', handle: '@shadowfeed.ai' },
        slides: updatedSlides,
        caption: post.caption,
        hashtags: post.hashtags,
        cta_text: post.cta_text,
        best_posting_time: post.posting_time,
    };

    // 3b. Override accent color: replace all #FF4500 → #2cff05
    const OLD_ACCENT = '#FF4500';
    const NEW_ACCENT = '#2cff05';
    console.log(`\n🎨 Overriding accent color: ${OLD_ACCENT} → ${NEW_ACCENT}`);

    if (fullJson.color_palette && (fullJson.color_palette as any).accent === OLD_ACCENT) {
        (fullJson.color_palette as any).accent = NEW_ACCENT;
    }

    fullJson.slides = fullJson.slides.map((slide: any) => {
        const updated = { ...slide };
        if (updated.accent_color === OLD_ACCENT) updated.accent_color = NEW_ACCENT;
        if (updated.text_color === OLD_ACCENT) updated.text_color = NEW_ACCENT;
        return updated;
    });

    // 4. Build renderer
    console.log('\n📦 Building renderer...');
    const { execSync } = await import('child_process');
    execSync('npm run build', { cwd: join(process.cwd(), 'renderer'), stdio: 'inherit' });
    console.log('✅ Renderer built.');

    // 5. Start static server
    console.log(`\n🌐 Starting slide server on port ${RENDERER_PORT}...`);
    const app = express();
    const distPath = join(process.cwd(), 'renderer', 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')));

    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
        const s = app.listen(RENDERER_PORT, () => {
            console.log('✅ Slide server ready.');
            resolve(s);
        });
    });

    // 6. Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true });

    // 7. Launch Puppeteer and capture slides
    console.log('\n🎨 Launching Puppeteer...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    const paths: string[] = [];

    for (let i = 0; i < updatedSlides.length; i++) {
        const jsonPayload = Buffer.from(JSON.stringify(fullJson)).toString('base64url');
        const url = `http://localhost:${RENDERER_PORT}/?data=${jsonPayload}&slide=${i}`;

        console.log(`  📸 Capturing slide ${i + 1}/${updatedSlides.length} (role: ${updatedSlides[i].role})...`);

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait for React signal
        try {
            await page.waitForSelector('[data-slide-ready="true"]', { timeout: 10000 });
        } catch {
            console.warn(`    ⚠️ Timeout waiting for data-slide-ready on slide ${i + 1}, capturing anyway...`);
        }

        // Wait for fonts
        await page.evaluate(() => document.fonts.ready);
        await new Promise((r) => setTimeout(r, 500)); // Extra delay for rendering

        const filename = `slide-${String(i + 1).padStart(2, '0')}.png`;
        const filepath = join(OUTPUT_DIR, filename);

        await page.screenshot({
            path: filepath,
            type: 'png',
            clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
        });

        paths.push(filepath);
        console.log(`    ✅ Saved: ${filepath}`);
    }

    // 8. Save metadata
    const metadataPath = join(OUTPUT_DIR, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify(fullJson, null, 2));

    // 9. Cleanup
    await browser.close();
    server.close();

    console.log('\n' + '━'.repeat(55));
    console.log(`🎉 Done! ${paths.length} slides captured.`);
    console.log(`📁 Output: ${OUTPUT_DIR}`);
    paths.forEach((p) => console.log(`   ${p}`));
}

main().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
