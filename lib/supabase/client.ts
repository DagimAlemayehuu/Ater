import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseBrowserClient: SupabaseClient | null = null;

export function getSupabaseBrowserClient(schema: string = 'public'): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  try {
    return createClient(url, anonKey, {
      db: { schema },
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  } catch (err) {
    console.warn('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function getAterDbClient(): SupabaseClient | null {
  return getSupabaseBrowserClient('ater');
}
