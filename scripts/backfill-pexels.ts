/**
 * One-off script: Backfill Pexels images on the latest post in Supabase.
 * 
 * Usage: npx tsx scripts/backfill-pexels.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { extractKeywordFromSlide } from '../src/shared/utils/keyword-extractor.js';
import { fetchPexelsImageByKeyword } from '../src/shared/services/pexels.service.js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function backfillLatestPost() {
    // 1. Fetch the latest post
    const { data: post, error } = await supabase
        .from('sf_posts')
        .select('id, slides, content_json')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (error || !post) {
        console.error('❌ Failed to fetch latest post:', error);
        process.exit(1);
    }

    console.log(`📄 Post found: ${post.id}`);
    console.log(`   Slides: ${post.slides?.length || 0}`);

    // 2. Process slides (the "slides" column has the themed/applied slides)
    const slides = post.slides as any[];
    if (!slides || slides.length === 0) {
        console.error('❌ No slides found in post');
        process.exit(1);
    }

    let updatedCount = 0;

    for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];

        // Check if this slide has an image slot (image object exists)
        if (slide.image && !slide.image.url) {
            const isHook = i === 0;

            // Extract keyword from headline + body
            const keyword = extractKeywordFromSlide(
                slide.headline || '',
                slide.body_markdown || slide.body || null,
                'business'
            );

            console.log(`   🔍 Slide ${i + 1} (${slide.role}): keyword = "${keyword}" | orientation = ${isHook ? 'portrait' : 'landscape'}`);

            const pexelsData = await fetchPexelsImageByKeyword(keyword, isHook);

            if (pexelsData) {
                slide.image = {
                    ...slide.image,
                    type: 'generated',
                    prompt: keyword,
                    url: pexelsData.url,
                };
                updatedCount++;
                console.log(`   ✅ Slide ${i + 1}: ${pexelsData.url.substring(0, 80)}...`);
            } else {
                console.log(`   ⚠️ Slide ${i + 1}: No Pexels result for "${keyword}"`);
            }
        }
    }

    if (updatedCount === 0) {
        console.log('ℹ️ No slides needed image backfill.');
        process.exit(0);
    }

    // 3. Also update content_json if it exists
    let contentJson = post.content_json as any;
    if (contentJson && contentJson.slides) {
        for (let i = 0; i < contentJson.slides.length; i++) {
            const cSlide = contentJson.slides[i];
            if (cSlide.image === true) {
                const keyword = extractKeywordFromSlide(
                    cSlide.headline || '',
                    cSlide.body_markdown || null,
                    'business'
                );
                const isHook = i === 0;
                const pexelsData = await fetchPexelsImageByKeyword(keyword, isHook);
                if (pexelsData) {
                    contentJson.slides[i] = {
                        ...cSlide,
                        image_keyword: keyword,
                        image_url: pexelsData.url,
                        image_credit: pexelsData.photographer,
                    };
                }
            }
        }
    }

    // 4. Update the post in Supabase
    const { error: updateError } = await supabase
        .from('sf_posts')
        .update({
            slides: slides,
            content_json: contentJson,
        })
        .eq('id', post.id);

    if (updateError) {
        console.error('❌ Failed to update post:', updateError);
        process.exit(1);
    }

    console.log(`\n🎉 Done! Updated ${updatedCount} slide(s) with Pexels images on post ${post.id}`);
}

backfillLatestPost().catch(console.error);
