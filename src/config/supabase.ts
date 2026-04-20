import { createClient } from '@supabase/supabase-js';

// Add your Supabase project URL and anon key here
// Get them from: https://app.supabase.com → Project Settings → API
const SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';
const SUPABASE_ANON = 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
