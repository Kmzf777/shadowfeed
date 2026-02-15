const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing with ANON KEY...');

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function test() {
    console.log('Fetching posts with Anon Key...');
    const { data, error } = await supabase
        .from('sf_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching posts:', error);
    } else {
        console.log(`Found ${data.length} posts with Anon Key.`);
    }
}

test();
