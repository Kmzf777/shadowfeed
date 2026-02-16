/**
 * Sanity test: Simulates the setup upsert directly via Supabase JS.
 *
 * Usage:
 *   npx tsx scripts/test-setup-upsert.ts
 *
 * Requirements:
 *   - NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in web/.env.local
 *   - You must be logged in (have a valid session) — OR run the RLS migration
 *     005_fix_users_rls.sql first so the service_role policy is in place.
 *
 * This script tests if the upsert to public.users works at all.
 * If it hangs or errors, the problem is RLS / Supabase config, not the app code.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from web/.env.local
dotenv.config({ path: path.resolve(__dirname, '../web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in web/.env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('=== Setup Upsert Sanity Test ===\n');
    console.log('Supabase URL:', supabaseUrl);

    // Check current auth session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
        console.log('\nNo active session. Testing anonymous upsert (will likely fail with RLS).');
        console.log('To test properly, sign in first or use a service_role key.\n');
    } else {
        console.log('\nLogged in as:', session.user.id, '(' + session.user.email + ')\n');
    }

    const testUserId = session?.user?.id || '00000000-0000-0000-0000-000000000000';

    // Test: upsert with timeout
    console.log('Attempting upsert for user:', testUserId);
    const startTime = Date.now();

    const upsertPromise = supabase
        .from('users')
        .upsert({
            id: testUserId,
            full_name: 'Test User',
            instagram_handle: 'Test User',
            instagram_username: 'testuser',
            target_audience: 'test audience',
            main_pain_point: 'test pain point',
            voice_tone: 'professional',
            user_prompt: 'test prompt',
            highlight_color: '#8a00c4',
            setup_completed: false, // Don't actually mark as completed
        }, { onConflict: 'id' });

    const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT: Upsert took longer than 15s')), 15000)
    );

    try {
        const { error } = await Promise.race([upsertPromise, timeoutPromise]);
        const elapsed = Date.now() - startTime;

        if (error) {
            console.error(`\nUPSERT FAILED (${elapsed}ms):`, error.message);
            console.error('Code:', error.code);
            console.error('Details:', error.details);
            console.error('\n-> This likely means RLS policies are wrong. Run 005_fix_users_rls.sql in Supabase SQL Editor.');
        } else {
            console.log(`\nUPSERT SUCCESS (${elapsed}ms)`);
            console.log('-> The upsert works. If the Finish button still fails, the issue is in the app code (race condition).');
        }
    } catch (err: any) {
        const elapsed = Date.now() - startTime;
        console.error(`\nUPSERT ERROR (${elapsed}ms):`, err.message);
        if (err.message.includes('TIMEOUT')) {
            console.error('-> The upsert is hanging. This is likely an RLS issue (no matching policy = silent hang).');
            console.error('-> Run 005_fix_users_rls.sql in Supabase SQL Editor.');
        }
    }
}

main().catch(console.error);
