import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Public read client — respects Row Level Security, safe to use in Server Components
export const supabase = createClient(url, anonKey);

// Admin client — bypasses RLS. Use ONLY in server-side API routes, never in client components.
export const supabaseAdmin = createClient(url, serviceKey);
