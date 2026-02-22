import { createClient } from '@supabase/supabase-js';

// Environment variables - set in .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ MISSING SUPABASE CONFIG:', {
    url: supabaseUrl ? '✅ Set' : '❌ Missing',
    key: supabaseAnonKey ? '✅ Set' : '❌ Missing',
  });
  console.error('💡 Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
} else {
  console.log('✅ Supabase configured:', supabaseUrl);
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export helper for checking connection
export async function checkSupabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('messages').select('id').limit(1);
    if (error) {
      console.error('❌ Supabase DB error:', error);
      return { ok: false, error: error.message };
    }
    console.log('✅ Supabase connection successful');
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('❌ Supabase connection failed:', err);
    return { ok: false, error: message };
  }
}
