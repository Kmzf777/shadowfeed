/**
 * Test: Render carousel with NEW design system + REAL images
 * - Alternating light/dark backgrounds
 * - Inline image positioning (3-zone)
 * - Real images from renderer/public/slides/
 *
 * Usage:  npx tsx scripts/test-new-design.ts
 */
import puppeteer from 'puppeteer';
import express from 'express';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { execSync } from 'child_process';

// ── Config ────────────────────────────────────────────────────────
const VIEWPORT = { width: 1080, height: 1350, deviceScaleFactor: 2 };
const RENDERER_PORT = 3003;
const OUTPUT_DIR = join(process.cwd(), 'output', 'test-new-design');

// ── Hardcoded carousel JSON (matches SlideData / CarouselData types) ──
const CAROUSEL_JSON = {
    theme: "A OpenAI esta matando startups — e os VCs estao furiosos",
    style: "editorial-magazine",
    total_slides: 9,
    color_palette: {
        bg_primary: "#0A0A0A",
        bg_secondary: "#F5F0EB",
        text_primary: "#FFFFFF",
        text_secondary: "#1A1A1A",
        accent: "#2cff05",
    },
    fonts: {
        headline: "Inter",
        body: "Inter",
    },
    branding: { name: "ShadowFeed", handle: "@vistra.ai" },
    caption: "A OpenAI esta matando startups. Salva esse post.",
    hashtags: ["#startups", "#openai", "#ai", "#gpt5"],
    cta_text: "Salva e compartilha",
    best_posting_time: "18:00",
    slides: [
        {
            slide: 1,
            layout: "hero-image",
            role: "hook",
            headline: "A OPENAI ESTA MATANDO STARTUPS — E NINGUEM ESTA PRONTO.",
            body: "",
            bg_color: "#0A0A0A",
            bg_gradient: null,
            text_color: "#FFFFFF",
            accent_color: "#2cff05",
            font_headline: "Inter",
            font_body: "Inter",
            font_size_headline: "52px",
            font_weight_headline: "800",
            font_size_body: "24px",
            text_align: "center" as const,
            icon: null,
            number_label: null,
            decorative_elements: [],
            image: {
                type: "upload" as const,
                prompt: "Dark futuristic cityscape with neon green accents",
                url: "/1.png",
                position: "background" as const,
                aspect_ratio: "4:5" as const,
            },
        },
        {
            slide: 2,
            layout: "article-body",
            role: "content",
            headline: "O PROBLEMA NAO E A IA. E O TIMING.",
            body: "Quando a OpenAI lancou o GPT-4 Turbo com 128k de contexto, dezenas de startups de summarization morreram da noite pro dia. Nao porque eram ruins — porque o problema que resolviam deixou de existir.\n\n**GPT-5 vai fazer o mesmo** com uma nova leva de empresas. A questao e: voce esta na lista?",
            bg_color: "#F5F0EB",
            bg_gradient: null,
            text_color: "#1A1A1A",
            accent_color: "#2cff05",
            font_headline: "Inter",
            font_body: "Inter",
            font_size_headline: "48px",
            font_weight_headline: "800",
            font_size_body: "24px",
            text_align: "left" as const,
            icon: null,
            number_label: "01",
            decorative_elements: [],
            image: {
                type: "upload" as const,
                prompt: "Startup office empty desks abandoned, cinematic",
                url: "/2.png",
                position: "inline" as const,
                aspect_ratio: "16:9" as const,
            },
        },
        {
            slide: 3,
            layout: "article-body",
            role: "content",
            headline: "3 CATEGORIAS QUE VAO DESAPARECER EM 2026",
            body: "**1. Wrappers de API** — se seu produto e uma interface bonita pra uma API que qualquer dev acessa, voce tem meses.\n\n**2. Automacoes simples** — workflows que o ChatGPT resolve com um plugin.\n\n**3. Analytics genericos** — dashboards que a IA gera sob demanda.",
            bg_color: "#0A0A0A",
            bg_gradient: null,
            text_color: "#FFFFFF",
            accent_color: "#2cff05",
            font_headline: "Inter",
            font_body: "Inter",
            font_size_headline: "48px",
            font_weight_headline: "800",
            font_size_body: "24px",
            text_align: "left" as const,
            icon: null,
            number_label: "02",
            decorative_elements: [],
            image: {
                type: "upload" as const,
                prompt: "Broken trophy on dark shelf, dramatic lighting",
                url: "/3.png",
                position: "inline" as const,
                aspect_ratio: "16:9" as const,
            },
        },
        {
            slide: 4,
            layout: "article-body",
            role: "content",
            headline: "MAS QUEM SOBREVIVE?",
            body: "Empresas com **dados proprietarios** que nenhum modelo generico acessa. Verticais com **regulacao pesada** onde compliance e barreira. Produtos com **efeito de rede** — quanto mais usuarios, melhor fica.\n\nA chave: seu valor precisa estar em algo que a plataforma base nao consegue replicar.",
            bg_color: "#F5F0EB",
            bg_gradient: null,
            text_color: "#1A1A1A",
            accent_color: "#2cff05",
            font_headline: "Inter",
            font_body: "Inter",
            font_size_headline: "48px",
            font_weight_headline: "800",
            font_size_body: "24px",
            text_align: "left" as const,
            icon: null,
            number_label: "03",
            decorative_elements: [],

        },
        {
            slide: 5,
            layout: "article-body",
            role: "content",
            headline: "O CASO JASPER: DE $1.5B A IRRELEVANCIA",
            body: "Jasper AI levantou $125M em 2022. Avaliacao de $1.5 bilhao. Produto: um wrapper do GPT-3 para marketing.\n\nQuando o ChatGPT lancou, **perderam 80% da proposta de valor** da noite pro dia. Hoje lutam pra sobreviver. A licao? Se sua startup pode ser substituida por um novo release da OpenAI, voce nao tem um produto — tem um feature.",
            bg_color: "#0A0A0A",
            bg_gradient: null,
            text_color: "#FFFFFF",
            accent_color: "#2cff05",
            font_headline: "Inter",
            font_body: "Inter",
            font_size_headline: "48px",
            font_weight_headline: "800",
            font_size_body: "24px",
            text_align: "left" as const,
            icon: null,
            number_label: "04",
            decorative_elements: [],
            image: {
                type: "upload" as const,
                prompt: "Falling stock chart on dark monitor, dramatic red",
                url: "/5.png",
                position: "inline" as const,
                aspect_ratio: "16:9" as const,
            },
        },
        {
            slide: 6,
            layout: "headline-only",
            role: "pattern-interrupt",
            headline: "SE VOCE PODE SER SUBSTITUIDO POR UMA API, VOCE NUNCA TEVE UM PRODUTO.",
            body: "Essa frase resume a realidade brutal do mercado de IA em 2026. Nao basta ter uma interface bonita ou um prompt bem feito — o valor precisa estar em algo que a plataforma base nao consegue replicar. **Todo o resto e feature, nao produto.**",
            bg_color: "#2cff05",
            bg_gradient: null,
            text_color: "#0A0A0A",
            accent_color: "#0A0A0A",
            font_headline: "Inter",
            font_body: "Inter",
            font_size_headline: "52px",
            font_weight_headline: "800",
            font_size_body: "24px",
            text_align: "center" as const,
            icon: null,
            number_label: null,
            decorative_elements: [],
        },
        {
            slide: 7,
            layout: "article-body",
            role: "content",
            headline: "VCS ESTAO FURIOSOS — E COM RAZAO",
            body: "Nem todo mundo concorda com a narrativa de evolucao natural. **Vinod Khosla** declarou que a OpenAI esta matando o ecossistema que a alimenta. Fundos como Sequoia e a16z investiram bilhoes em startups agora enfrentando obsolescencia.\n\nFounders de pelo menos **8 startups pivotaram em panico** na ultima semana. A questao central: ate que ponto e saudavel que uma unica empresa defina o que e feature e o que e produto?",
            bg_color: "#F5F0EB",
            bg_gradient: null,
            text_color: "#1A1A1A",
            accent_color: "#2cff05",
            font_headline: "Inter",
            font_body: "Inter",
            font_size_headline: "48px",
            font_weight_headline: "800",
            font_size_body: "24px",
            text_align: "left" as const,
            icon: null,
            number_label: "05",
            decorative_elements: [],
            image: {
                type: "upload" as const,
                prompt: "Serious businessman in dark boardroom, harsh side lighting, tension",
                url: "/7.png",
                position: "inline" as const,
                aspect_ratio: "16:9" as const,
            },
        },
        {
            slide: 8,
            layout: "article-body",
            role: "conclusion",
            headline: "A LICAO? CONSTRUA O QUE A IA NAO PODE COMMODITIZAR.",
            body: "O mercado de IA esta passando pela mesma consolidacao que aconteceu com smartphones e cloud computing. **Seu valor precisa estar em algo que nenhum update de API pode replicar**: dados proprietarios, distribuicao consolidada, expertise vertical profunda.\n\nQuem sobrevive nao compete com a OpenAI — **usa ela como fundacao e constroi um castelo em cima.**",
            bg_color: "#0A0A0A",
            bg_gradient: null,
            text_color: "#FFFFFF",
            accent_color: "#2cff05",
            font_headline: "Inter",
            font_body: "Inter",
            font_size_headline: "48px",
            font_weight_headline: "800",
            font_size_body: "24px",
            text_align: "left" as const,
            icon: null,
            number_label: "06",
            decorative_elements: [],
        },
        {
            slide: 9,
            layout: "profile-card",
            role: "cta",
            headline: "SALVA ESSE POST E MANDA PRA AQUELE FOUNDER QUE PRECISA OUVIR ISSO",
            body: "Qual startup voce acha que vai sobreviver ao GPT-5?\nComenta aqui embaixo — quero ler sua analise.",
            bg_color: "#F5F0EB",
            bg_gradient: null,
            text_color: "#1A1A1A",
            accent_color: "#2cff05",
            font_headline: "Inter",
            font_body: "Inter",
            font_size_headline: "44px",
            font_weight_headline: "800",
            font_size_body: "22px",
            text_align: "center" as const,
            icon: null,
            number_label: null,
            decorative_elements: [],
        },
    ],
};

// ── Main ──────────────────────────────────────────────────────────
async function main() {
    console.log('🚀 ShadowFeed — NEW DESIGN TEST (with real images)');
    console.log('━'.repeat(55));

    // 1. Build renderer
    console.log('\n📦 Building renderer...');
    execSync('npm run build', { cwd: join(process.cwd(), 'renderer'), stdio: 'inherit' });
    console.log('✅ Renderer built.');

    // 2. Start static server
    console.log(`\n🌐 Starting slide server on port ${RENDERER_PORT}...`);
    const app = express();
    const distPath = join(process.cwd(), 'renderer', 'dist');
    app.use(express.static(distPath));
    // Also serve public/slides for real images
    app.use('/slides', express.static(join(process.cwd(), 'renderer', 'public', 'slides')));
    app.get('*', (_req, res) => res.sendFile(join(distPath, 'index.html')));

    const server = await new Promise<ReturnType<typeof app.listen>>((resolve) => {
        const s = app.listen(RENDERER_PORT, () => {
            console.log('✅ Slide server ready.');
            resolve(s);
        });
    });

    // 3. Create output directory
    await mkdir(OUTPUT_DIR, { recursive: true });

    // 4. Launch Puppeteer and capture slides
    console.log('\n🎨 Launching Puppeteer...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport(VIEWPORT);

    const paths: string[] = [];
    const slides = CAROUSEL_JSON.slides;

    for (let i = 0; i < slides.length; i++) {
        const jsonPayload = Buffer.from(JSON.stringify(CAROUSEL_JSON)).toString('base64url');
        const url = `http://localhost:${RENDERER_PORT}/?data=${jsonPayload}&slide=${i}`;

        console.log(`  📸 Capturing slide ${i + 1}/${slides.length} (layout: ${slides[i].layout}, role: ${slides[i].role})...`);

        await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

        // Wait for React signal
        try {
            await page.waitForSelector('[data-slide-ready="true"]', { timeout: 10000 });
        } catch {
            console.warn(`    ⚠️ Timeout on slide ${i + 1}, capturing anyway...`);
        }

        // Wait for fonts + images
        await page.evaluate(() => document.fonts.ready);
        await new Promise((r) => setTimeout(r, 800));

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

    // 5. Cleanup
    await browser.close();
    server.close();

    console.log('\n' + '━'.repeat(55));
    console.log(`🎉 Done! ${paths.length} slides captured.`);
    console.log(`📁 Output: ${OUTPUT_DIR}`);
}

main().catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
});
