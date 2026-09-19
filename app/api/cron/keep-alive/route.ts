import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Supabase free tier pauses a project after 7 days without activity. Vercel
// Cron (see vercel.json) hits this daily so one real query keeps it awake.
// Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically when the
// env var is set; anything else is rejected.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { count, error } = await createAdminClient()
    .from('profiles')
    .select('id', { count: 'exact', head: true })

  if (error) {
    console.error('keep-alive query failed:', error)
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, profiles: count, at: new Date().toISOString() })
}
