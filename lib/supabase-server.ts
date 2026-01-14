import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Use a module-level variable to store the singleton instance
let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseServerClient(): SupabaseClient {
  // Return the existing instance if it has already been created
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Prioritize the service role key for server-side operations, fall back to anon key
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Supabase configuration missing: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY) must be set.');
  }

  // Create the client instance
  supabaseInstance = createClient(url, key);

  return supabaseInstance;
}
