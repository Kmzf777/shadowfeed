const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Fetching posts...');
    const { data, error } = await supabase
        .from('sf_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

    if (error) {
        console.error('Error fetching posts:', error);
        fs.writeFileSync('post_error.txt', JSON.stringify(error, null, 2));
    } else {
        console.log(`Found ${data.length} posts.`);
        if (data.length > 0) {
            fs.writeFileSync('post_data.json', JSON.stringify(data[0], null, 2));
            console.log('Saved post data to post_data.json');
        }
    }
}

test();
