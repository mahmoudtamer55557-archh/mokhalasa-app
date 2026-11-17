import { createClient } from '@supabase/supabase-js';

// Permanent production Supabase credentials for Mahmoud Tamer's project (mahmoudtamer55557@gmail.com)
const supabaseUrl = 'https://nngwnchzqilqphwrqqin.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uZ3duY2h6cWlscXBod3JxcWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2MjI0NTcsImV4cCI6MjEwODE5ODQ1N30.WxIxxLytpP2dEGo6O5Rn3hU1MSTfXq_zRgUovUZu7sU';

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
