
import { supabase } from '../src/config/supabase.js';
import fs from 'fs';

async function main() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(1);

    if (error || !data || data.length === 0) {
        console.error('Error fetching user:', error);
        return;
    }

    const user = data[0];
    console.log('Found User ID:', user.id);
    fs.writeFileSync('user_id.txt', user.id);

    if (!user.setup_completed) {
        console.log('Updating setup_completed to true...');
        await supabase
            .from('users')
            .update({ setup_completed: true, voice_tone: 'Professional', target_audience: 'Tech Enthusiasts' })
            .eq('id', user.id);
    }
}

main();
