import { createClient } from '@supabase/supabase-js';

// IMPORTANT: In browser/client code, only use the public anon key.
// Server-only code should create its own client with the service role key when needed.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
