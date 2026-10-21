import {createClient} from '@supabase/supabase-js'

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.invalid"
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sandbox-anon-key"

// Client-side supabase (with anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side supabase (with service_role key - bypasses RLS)
export const supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
)

