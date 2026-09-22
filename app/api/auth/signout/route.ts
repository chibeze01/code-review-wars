import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  // 303 forces the browser to follow with GET. A 307 (the redirect default)
  // preserves the form's POST and the target page answers 405.
  return NextResponse.redirect(new URL('/', request.url), 303)
}
