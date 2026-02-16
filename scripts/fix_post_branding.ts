
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
// Import renderPost. Ensure path is correct relative to scripts/
import { renderPost } from '../src/modules/render/render.service';
import * as fs from 'fs';

// Try to import logger. 
// Using relative path from scripts/ folder to src/config/logger.ts
// In standard Node/TSX, this should work.
import { logger } from '../src/config/logger';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPostBranding() {
    const postId = 'f1b1b4e3-9beb-4562-b54d-a410879f5b03';

    console.log(`[FIX] Fetching post ${postId}...`);

    const { data: post, error } = await supabase
        .from('sf_posts')
        .select('*')
        .eq('id', postId)
        .single();

    if (error || !post) {
        console.error('[FIX] Error fetching post:', error);
        return;
    }

    const updates: any = {};

    // 1. Fix Slides (JSONB array)
    if (post.slides && Array.isArray(post.slides)) {
        let slidesStr = JSON.stringify(post.slides);
        const originalSlidesStr = slidesStr;

        // Global replacement in slides
        const replacements = [
            { from: /ShadowFeed/g, to: 'Vistra IA' },
            { from: /@shadowfeed\.ai/g, to: '@vistra.ai' },
            { from: /@shadowfeed/g, to: '@vistra.ai' },
            { from: /feito com ShadowFeed/g, to: 'feito com Vistra IA' },
        ];

        for (const { from, to } of replacements) {
            slidesStr = slidesStr.replace(from, to);
        }

        if (slidesStr !== originalSlidesStr) {
            console.log('[FIX] Modifying slides data...');
            updates.slides = JSON.parse(slidesStr);
        }
    }

    // 2. Fix Profile (JSONB)
    if (post.profile) {
        let profile = { ...post.profile };
        let modified = false;
        if (profile.display_name?.includes('ShadowFeed')) {
            profile.display_name = 'Vistra IA';
            modified = true;
        }
        if (profile.username?.includes('adowfeed')) {
            profile.username = '@vistra.ai';
            modified = true;
        }
        if (modified) {
            console.log('[FIX] Modifying profile data...');
            updates.profile = profile;
        }
    }

    // 3. Fix Branding (JSONB)
    if (post.branding) {
        let branding = { ...post.branding };
        let modified = false;
        if (branding.name?.includes('ShadowFeed')) {
            branding.name = 'Vistra IA';
            modified = true;
        }
        if (branding.handle?.includes('adowfeed')) {
            branding.handle = '@vistra.ai';
            modified = true;
        }
        if (modified) {
            console.log('[FIX] Modifying branding data...');
            updates.branding = branding;
        }
    }

    if (Object.keys(updates).length > 0) {
        console.log('[FIX] Updating Supabase (fields: ' + Object.keys(updates).join(', ') + ')...');

        // We must set status to draft, otherwise renderPost throws "expected draft"
        updates.status = 'draft';

        const { error: updateError } = await supabase
            .from('sf_posts')
            .update(updates)
            .eq('id', postId);

        if (updateError) {
            console.error('[FIX] Error updating post:', updateError);
            return;
        }
        console.log('[FIX] Database updated.');
    } else {
        console.log('[FIX] No changes detected in branding/slides, but forcing re-render...');
        // Even if no branding changed, we want to re-render to pick up Codebase changes (React components)
        // So we must set status to 'draft' to allow renderPost to run.
        const { error: updateError } = await supabase
            .from('sf_posts')
            .update({ status: 'draft' })
            .eq('id', postId);

        if (updateError) {
            console.error('[FIX] Error setting status to draft:', updateError);
            return;
        }
    }

    // 4. Re-render
    console.log('[FIX] Triggering Re-render...');
    // renderPost(postId) fetches the post again.
    try {
        const result = await renderPost(postId);
        console.log('[FIX] Re-render complete. Paths:', result.paths);
    } catch (err) {
        console.error('[FIX] Error during renderPost:', err);
        throw err;
    }
}

fixPostBranding().catch(err => {
    console.error('Fatal error details:', err);
    fs.writeFileSync('fix_error.log', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
});
