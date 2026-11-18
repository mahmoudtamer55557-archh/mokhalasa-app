import { createClient } from '@supabase/supabase-js';

// Permanent production Supabase credentials for Mahmoud Tamer's project (vakqpfsuunfjnsnqdjea)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vakqpfsuunfjnsnqdjea.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_qvEWgW2z_vaXSgEygZzc9g_zDlD6aur';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.info('Mokhalasa: Using built-in Supabase production endpoints.');
}

// Single, centralized Supabase client instance for the entire application
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);

export default supabase;
