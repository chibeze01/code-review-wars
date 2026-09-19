import { createClient } from '@supabase/supabase-js'

// Service-role client — bypasses RLS. Use ONLY in server routes for
// server-authoritative writes (session creation, scoring/completion) that the
// client must never be able to forge. Never import this into client code.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}
