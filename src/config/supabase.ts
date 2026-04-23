import { createClient } from '@supabase/supabase-js';

// Add your Supabase project URL and anon key here
// Get them from: https://app.supabase.com → Project Settings → API
const SUPABASE_URL  = 'https://qqrqlmdkwnqwbifaakyo.supabase.co';
const SUPABASE_ANON = 'sb_publishable_n3_xravi1oTkzgUWZXQhUw_SCCCYEIG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
