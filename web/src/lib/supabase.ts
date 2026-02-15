import { createClient } from '@supabase/supabase-js';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

/**
 * Browser-side Supabase client with anonymous key
 * - Respects Row Level Security (RLS)
 * - Use for all client-side operations
 * - Handles authentication automatically
 * - Safe to use in browser
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'shadowfeed-web',
      },
    },
  }
);

/**
 * Legacy export for backwards compatibility
 * @deprecated Use `supabase` instead
 */
export const supabaseClient = supabase;
