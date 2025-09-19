import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let serverClient: SupabaseClient | null = null;

export function getServerClient(): SupabaseClient {
  if (serverClient) return serverClient;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Supabase server env vars are missing. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }
  serverClient = createClient(supabaseUrl, supabaseServiceKey);
  return serverClient;
}
