import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let client: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    client = createClient(supabaseUrl, supabaseAnonKey);
  } catch (e) {
    console.error('Failed to create Supabase client:', e);
  }
}

// Proxy that gracefully handles missing client — returns empty results instead of crashing
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    if (!client) {
      console.warn(`Supabase client not initialized — accessing .${String(prop)} will return no-op`);
      return new Proxy(() => {}, {
        get() { return () => Promise.resolve({ data: null, error: { message: 'Client not initialized' } }); },
        apply() { return Promise.resolve({ data: null, error: { message: 'Client not initialized' } }); },
      });
    }
    return (client as any)[prop];
  },
});
