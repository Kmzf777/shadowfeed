
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load env vars
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(
    envConfig.NEXT_PUBLIC_SUPABASE_URL,
    envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPaths() {
    console.log('Fetching last post with rendered_paths...');
    const { data, error } = await supabase
        .from('sf_posts')
        .select('id, theme, rendered_paths')
        .not('rendered_paths', 'is', null)
        .limit(1)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Post Theme:', data.theme);
    console.log('Rendered Paths:', data.rendered_paths);
}

checkPaths();
