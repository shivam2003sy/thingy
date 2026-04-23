import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL  = 'https://qqrqlmdkwnqwbifaakyo.supabase.co';
const SUPABASE_ANON = 'sb_publishable_n3_xravi1oTkzgUWZXQhUw_SCCCYEIG';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    storage: AsyncStorage,       // required for React Native — no localStorage here
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
