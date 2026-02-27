import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearQueue() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);
    console.log(`Clearing queue for date: ${tomorrowStr}`);

    const { data, error } = await supabase
        .from('sf_shadowfeed_queue')
        .delete()
        .eq('scheduled_date', tomorrowStr);

    if (error) {
        console.error('Error clearing queue:', error);
    } else {
        console.log('Successfully cleared queue for tomorrow.');
    }
}

clearQueue();
