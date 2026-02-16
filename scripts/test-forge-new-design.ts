import puppeteer from 'puppeteer';
import express from 'express';
import { join } from 'path';
import { mkdir, writeFile } from 'fs/promises';

// Hardcoded carousel data with NEW DESIGN (Neon Green, Inter Tight/Inter)
const CAROUSEL_DATA = {
    theme: "Ferramentas de IA para produtividade - TESTE DESIGN",
    style: "neon-tech",
    total_slides: 7,
    branding: {
        name: "ShadowFeed",
        handle: "@shadowfeed.ai"
    },
    color_palette: {
        bg_primary: "#050511",
        bg_secondary: "#0A0A1A",
        text_primary: "#F5F5F0",
        text_secondary: "#A0A0A0",
        accent: "#2cff05"
    },
    fonts: {
        headline: "Inter Tight",
        body: "Inter"
    },
    slides: [
        {
            slide: 1,
            role: "hook",
            headline: "5 IAs que vão **substituir** metade do seu trabalho",
            body_markdown: null,
            body: null,
            layout: "hero-image",
            image: {
                type: "placeholder",
                prompt: "Futuristic cyborg hand holding a glowing orb representing productivity, dark background, neon green accents",
                url: null
            },
            bg_color: "#050511",
            bg_gradient: "linear-gradient(180deg, #050511 0%, #0A0A1A 100%)",
            text_color: "#F5F5F0",
            accent_color: "#2cff05", // Neon Green
            font_headline: "Inter Tight",
            font_body: "Inter",
            font_size_headline: "80px",
            font_weight_headline: "900",
            font_size_body: "24px",
            text_align: "center",
            icon: null,
            number_label: null,
            decorative_elements: ["bottom-gradient-fade"]
        },
        {
            slide: 2,
            role: "content",
            headline: "Cursor AI",
            body_markdown: "**O que faz:** Programa sem saber programar.\n\n- Escreve código\n- Corrige bugs\n- Explica a lógica",
            body: null,
            layout: "split-right",
            image: {
                type: "placeholder",
                prompt: "Screenshot of a code editor with AI suggestions glowing",
                url: null
            },
            bg_color: "#050511",
            bg_gradient: null,
            text_color: "#F5F5F0",
            accent_color: "#2cff05",
            font_headline: "Inter Tight",
            font_body: "Inter",
            font_size_headline: "48px",
            font_weight_headline: "700",
            font_size_body: "24px",
            text_align: "left",
            icon: null,
            number_label: "01",
            decorative_elements: ["side-bar-accent"]
        },
        {
            slide: 3,
            role: "pattern-interrupt",
            headline: "**Pare de perder tempo.**",
            body_markdown: "A IA não é o futuro, é o presente. Quem não usa, fica para trás.",
            body: null,
            layout: "title-body",
            image: null,
            bg_color: "#2cff05", // Neon Green
            bg_gradient: null,
            text_color: "#050511",
            accent_color: "#050511",
            font_headline: "Inter Tight",
            font_body: "Inter",
            font_size_headline: "56px",
            font_weight_headline: "800",
            font_size_body: "20px",
            text_align: "center",
            icon: null,
            number_label: null,
            decorative_elements: []
        },
        {
            slide: 4,
            role: "cta",
            headline: "Salva esse post 🔖",
            body_markdown: "E manda pra alguém que precisa automatizar o trabalho.",
            body: null,
            layout: "profile-card",
            image: {
                type: "placeholder",
                prompt: "Professional headshot of the creator in a circle frame",
                url: null
            },
            bg_color: "#050511",
            bg_gradient: "linear-gradient(180deg, #0A0A1A 0%, #050511 100%)",
            text_color: "#F5F5F0",
            accent_color: "#2cff05",
            font_headline: "Inter Tight",
            font_body: "Inter",
            font_size_headline: "48px",
            font_weight_headline: "800",
            font_size_body: "24px",
            text_align: "center",
            icon: null,
            number_label: null,
            decorative_elements: ["top-line-accent"]
        }
    ],
    caption: "Teste de design...",
    hashtags: ["#ia", "#tech"],
    cta_text: "Salva esse post 🔖",
    best_posting_time: "14:00 BRT"
};

const VIEWPORT = { width: 1080, height: 1350, deviceScaleFactor: 2 };
const RENDERER_PORT = 3002;
const OUTPUT_DIR = join(process.cwd(), 'output', 'test-forge-design');

async function main() {
    console.log('🚀 ShadowFeed NEW Design Test');
    console.log('━'.repeat(50));

    // 1. Build renderer
    console.log('\n📦 Building renderer...');
    const { execSync } = await import('child_process');
    execSync('npm run build', { cwd: join(process.cwd(), 'renderer'), stdio: 'inherit' });
    console.log('✅ Renderer built.');

    // 2. Start static server
    console.log('\n🌐 Starting slide server on port', RENDERER_PORT, '...');
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

    // 3. Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true });

    // 4. Launch Puppeteer
    console.log('\n🎨 Launching Puppeteer...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    const paths: string[] = [];

    for (let i = 0; i < CAROUSEL_DATA.slides.length; i++) {
        const jsonPayload = Buffer.from(JSON.stringify(CAROUSEL_DATA)).toString('base64url');
        const url = `http://localhost:${RENDERER_PORT}/?data=${jsonPayload}&slide=${i}`;

        console.log(`  📸 Capturing slide ${i + 1}/${CAROUSEL_DATA.slides.length}...`);

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });

        // Wait for React signal
        try {
            await page.waitForSelector('[data-slide-ready="true"]', { timeout: 10000 });
        } catch {
            console.warn(`    ⚠️ Timeout waiting for data-slide-ready on slide ${i + 1}, capturing anyway...`);
        }

        // Wait for fonts
        await page.evaluate(() => document.fonts.ready);
        await new Promise(r => setTimeout(r, 500)); // Extra delay for rendering

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

    // 5. Save metadata
    const metadataPath = join(OUTPUT_DIR, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify(CAROUSEL_DATA, null, 2));

    // 6. Cleanup
    await browser.close();
    server.close();

    console.log('\n' + '━'.repeat(50));
    console.log(`🎉 Done! ${paths.length} slides captured.`);
    console.log(`📁 Output: ${OUTPUT_DIR}`);
    paths.forEach(p => console.log(`   ${p}`));
}

main().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
