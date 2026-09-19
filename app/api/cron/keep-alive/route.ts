import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

const JOB = 'keep-alive'
const LOG = `[cron:${JOB}]`

// Heartbeats are kept for three months — long enough to spot a job that has
// been quietly dying, short enough that the table never needs thinking about.
const RETAIN_DAYS = 90

// Supabase free tier pauses a project after 7 days without activity. Vercel
// Cron (see vercel.json) hits this daily so one write keeps it awake.
//
// Every outcome is logged with the same prefix so `vercel logs --query
// "[cron:keep-alive]"` finds all of them, and each run also records a row in
// cron_heartbeats, which outlives Vercel's log retention.
export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  const secret = process.env.CRON_SECRET

  // A missing secret and a caller with the wrong token both have to return 401,
  // but they are completely different problems: one is our misconfiguration,
  // the other is the guard doing its job. Logged apart so a forgotten env var
  // can't hide behind what looks like routine rejection noise.
  if (!secret) {
    console.error(`${LOG} misconfigured: CRON_SECRET is not set, so every run will fail`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    console.warn(`${LOG} rejected: bad or missing bearer token`)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // An INSERT is unambiguous database activity, which is what the job is for,
  // and it doubles as the run record.
  const { error: writeError } = await admin
    .from('cron_heartbeats')
    .insert({ job: JOB, ok: true })

  if (writeError) {
    const durationMs = Date.now() - startedAt
    console.error(`${LOG} FAILED after ${durationMs}ms: ${writeError.message}`)
    // Best-effort failure record. If the database is unreachable this write
    // fails too — a gap in the table is itself the signal.
    await admin
      .from('cron_heartbeats')
      .insert({ job: JOB, ok: false, detail: writeError.message, duration_ms: durationMs })
    return NextResponse.json({ ok: false, error: writeError.message }, { status: 500 })
  }

  const durationMs = Date.now() - startedAt
  console.log(`${LOG} ok in ${durationMs}ms`)

  // Cheap and bounded: clears the handful of rows that aged out since the
  // previous run.
  const cutoff = new Date(Date.now() - RETAIN_DAYS * 86_400_000).toISOString()
  await admin.from('cron_heartbeats').delete().lt('ran_at', cutoff)

  return NextResponse.json({ ok: true, job: JOB, durationMs, at: new Date().toISOString() })
}
