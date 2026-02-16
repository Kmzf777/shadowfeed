
import { supabase } from '../src/config/supabase.js';

async function main() {
    const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

    if (error) {
        console.error('Error fetching user:', error);
        process.exit(1);
    }

    if (data && data.length > 0) {
        console.log('USER_ID:', data[0].id);
    } else {
        console.log('No users found.');
    }
}

main();
