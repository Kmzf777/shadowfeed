/**
 * Test Script: Verify Pexels images are automatically added to NEW posts.
 * usage: npx tsx scripts/test-forge-flow.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { forgePersonalizedCarousel } from '../src/modules/forge-personalized/forge-personalized.service.js';

const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testForgeFlow() {
    console.log('🚀 Starting end-to-end test of forge-personalized flow...');

    // 1. Get a valid user
    const { data: user } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .single();

    if (!user) {
        console.error('❌ No users found in DB to test with.');
        process.exit(1);
    }
    console.log(`👤 Using user ID: ${user.id}`);

    // 2. Generate a new post using the service directly
    try {
        const post = await forgePersonalizedCarousel({
            userId: user.id,
            themeId: 'twitter', // Maps to authority theme internally
            title: 'Pexels Integration Test',
            rawContent: 'This is a test post to verify that images are automatically fetched from Pexels based on keywords. We expect to see valid image URLs in the result.',
            summary: 'Testing Pexels integration',
            url: 'https://example.com/test',
            category: 'Tech',
        });

        console.log(`✅ Post generated successfully! ID: ${post.id}`);

        // 3. Verify images
        const slides = post.slides as any[];
        let imageCount = 0;
        let pexelsCount = 0;

        slides.forEach((slide, i) => {
            if (slide.image) {
                imageCount++;
                if (slide.image.url && slide.image.url.includes('pexels.com')) {
                    pexelsCount++;
                    console.log(`   📸 Slide ${i + 1}: Found Pexels image (${slide.image.url.substring(0, 50)}...)`);
                } else {
                    console.log(`   ⚠️ Slide ${i + 1}: Has image slot but NO Pexels URL (url=${slide.image.url})`);
                }
            }
        });

        console.log(`\n📊 Summary:`);
        console.log(`   Total slides: ${slides.length}`);
        console.log(`   Slides with image slot: ${imageCount}`);
        console.log(`   Slides with valid Pexels URL: ${pexelsCount}`);

        if (pexelsCount > 0) {
            console.log('🎉 SUCCESS: Pexels integration is working for new posts!');
        } else {
            console.error('❌ FAILURE: No Pexels images found in the generated post.');
            process.exit(1);
        }

    } catch (err) {
        console.error('❌ Error during generation:', err);
        process.exit(1);
    }
}

testForgeFlow();
