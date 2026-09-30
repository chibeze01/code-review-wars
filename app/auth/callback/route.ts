import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // Password recovery emails carry a token_hash so the link works in any
  // browser; PKCE `code` links only work in the browser that requested them.
  const tokenHash = searchParams.get('token_hash')
  // Only same-site paths — `@evil.com` or `//evil.com` would leave the site.
  const nextParam = searchParams.get('next')
  const next = nextParam?.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/dashboard'

  if (code || tokenHash) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )
    const { error } = tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
      : await supabase.auth.exchangeCodeForSession(code!)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
