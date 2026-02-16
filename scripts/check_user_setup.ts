
import { supabase } from '../src/config/supabase.js';

const USER_ID = '72eebc83-6424-4b8d-b2b6-e4d337be9c0e';

async function main() {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', USER_ID)
        .single();

    if (error) {
        console.error('Error fetching user:', error);
        return;
    }

    console.log('User Profile:', {
        id: data.id,
        setup_completed: data.setup_completed,
        voice_tone: data.voice_tone,
        target_audience: data.target_audience
    });

    if (!data.setup_completed) {
        console.log('Updating setup_completed to true...');
        const { error: updateError } = await supabase
            .from('users')
            .update({ setup_completed: true, voice_tone: 'Professional', target_audience: 'Tech Enthusiasts' })
            .eq('id', USER_ID);

        if (updateError) console.error('Error updating:', updateError);
        else console.log('User updated successfully.');
    }
}

main();
