/**
 * Re-render script — reads metadata.json from the last generated post,
 * builds the renderer, and captures all slides as PNGs.
 *
 * Usage:  npx tsx scripts/re-render.ts
 */
import puppeteer from 'puppeteer';
import express from 'express';
import { readFile, mkdir } from 'fs/promises';
import { join } from 'path';

const METADATA_PATH = join(
    process.cwd(),
    'output', '2026-02-11', '74f7d721-bd20-46e2-b01e-bcd491fe2e16', 'metadata.json'
);

const VIEWPORT = { width: 1080, height: 1350, deviceScaleFactor: 2 };
const RENDERER_PORT = 3001;
const OUTPUT_DIR = join(process.cwd(), 'output', 'rerender-test');

async function main() {
    console.log('🔄 Re-render test — verifying fixes on last generated post');
    console.log('━'.repeat(55));

    // 1. Read metadata
    console.log('\n📂 Reading metadata...');
    const raw = await readFile(METADATA_PATH, 'utf-8');
    const carouselData = JSON.parse(raw);
    const slideCount = carouselData.slides.length;
    console.log(`   Found ${slideCount} slides.`);

    // 2. Build renderer
    console.log('\n📦 Building renderer...');
    const { execSync } = await import('child_process');
    execSync('npm run build', { cwd: join(process.cwd(), 'renderer'), stdio: 'inherit' });
    console.log('✅ Renderer built.');

    // 3. Start static server
    console.log('\n🌐 Starting server on port', RENDERER_PORT, '...');
    const app = express();
    const distPath = join(process.cwd(), 'renderer', 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')));

    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
        const s = app.listen(RENDERER_PORT, () => {
            console.log('✅ Server ready.');
            resolve(s);
        });
    });

    // 4. Create output dir
    await mkdir(OUTPUT_DIR, { recursive: true });

    // 5. Launch Puppeteer
    console.log('\n🎨 Launching Puppeteer...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    // Capture browser console logs
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.error('BROWSER ERROR:', err));

    const paths: string[] = [];

    for (let i = 0; i < slideCount; i++) {
        const jsonPayload = Buffer.from(JSON.stringify(carouselData)).toString('base64url');
        const url = `http://localhost:${RENDERER_PORT}/?data=${jsonPayload}&slide=${i}`;

        console.log(`  📸 Capturing slide ${i + 1}/${slideCount}...`);

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

        try {
            await page.waitForSelector('[data-slide-ready="true"]', { timeout: 10000 });
        } catch {
            console.warn(`    ⚠️ Timeout on slide ${i + 1}, capturing anyway...`);
        }

        await page.evaluate(() => document.fonts.ready);
        await new Promise(r => setTimeout(r, 500));

        const filename = `slide-${String(i + 1).padStart(2, '0')}.png`;
        const filepath = join(OUTPUT_DIR, filename);

        await page.screenshot({
            path: filepath,
            type: 'png',
            clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
        });

        paths.push(filepath);
        console.log(`    ✅ ${filename}`);
    }

    // 6. Cleanup
    await browser.close();
    server.close();

    console.log('\n' + '━'.repeat(55));
    console.log(`🎉 Done! ${paths.length} slides re-rendered.`);
    console.log(`📁 Output: ${OUTPUT_DIR}`);
    paths.forEach(p => console.log(`   ${p}`));
}

main().catch((err) => {
    console.error('❌ Re-render failed:', err);
    process.exit(1);
});
