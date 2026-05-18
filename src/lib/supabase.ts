import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase credentials not found. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  );
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

/**
 * Check whether the configured Supabase instance is actually reachable.
 * Returns `true` if the server responds, `false` otherwise.
 * Used to guard OAuth redirects so the browser never navigates to a dead URL.
 */
export async function isSupabaseAvailable(): Promise<boolean> {
  const url = supabaseUrl;
  if (!url || url.includes('placeholder')) return false;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`${url}/auth/v1/settings`, {
      signal: controller.signal,
      headers: { apikey: supabaseAnonKey || '' },
    });
    clearTimeout(timeout);
    return res.ok;
  } catch {
    return false;
  }
}
