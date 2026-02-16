import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { forgeAuthorityCarousel } from '../src/modules/forge-authority/forge-authority.service.js';
import { renderPost } from '../src/modules/render/render.service.js';
import { logger } from '../src/config/logger.js';
import type { IntelSource } from '../src/shared/types/global.types.js';

async function runManualAuthority() {
    const filePath = path.resolve(process.cwd(), 'promptnoticia.md');

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        process.exit(1);
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    const url = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();

    // Extract title from content (first non-empty line after URL)
    const title = lines.slice(1).find(l => l.trim().length > 0)?.trim() || 'News Update';

    console.log('--- Manual Authority Pipeline ---');
    console.log(`URL: ${url}`);
    console.log(`Title: ${title}`);
    console.log(`Content Length: ${content.length} chars`);

    const manualSource: Partial<IntelSource> = {
        id: 'manual',
        source_type: 'manual',
        title: title,
        url: url,
        raw_content: content,
        category: 'industry_news',
        source_score: 9999, // High score to simulate trend
        relevance_score: 10,
        collected_at: new Date().toISOString(),
    };

    try {
        // 1. Forge
        console.log('\n> Forging Carousel...');
        const post = await forgeAuthorityCarousel(undefined, undefined, manualSource);
        console.log(`Generated Post ID: ${post.id}`);
        console.log(`Theme: ${post.theme}`);

        // 2. Render
        console.log('\n> Rendering Images...');
        const renderResult = await renderPost(post.id);
        console.log(`Rendered ${renderResult.slideCount} slides.`);
        console.log(`Paths:`, renderResult.paths);

        console.log('\n--- Success ---');
        process.exit(0);

    } catch (err) {
        console.error('\n--- Failed ---');
        console.error(err);
        process.exit(1);
    }
}

runManualAuthority();
