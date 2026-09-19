import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/DashboardClient'
import { SmallScreenNotice } from '@/components/SmallScreenNotice'
import type { InProgressSession } from '@/types'

const RESUME_COLS = 'id, code, scenario, language, issues, domain, context, annotations, general_notes, created_at'

// Each row carries its full code snippet, so cap how many we ship to the client.
// Anything older stays reachable from the history page.
const MAX_OPEN_SESSIONS = 5

export default async function TrainPage({
  searchParams,
}: {
  searchParams: Promise<{ resume?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { resume } = await searchParams

  // What to offer back: one specific session (?resume=id) or every unfinished
  // one, newest first, so the prompt can list them. Only the explicit ?resume
  // form skips the prompt.
  let resumeQuery = supabase
    .from('review_sessions')
    .select(RESUME_COLS)
    .eq('user_id', user.id)
    .eq('status', 'in_progress')
  resumeQuery = resume
    ? resumeQuery.eq('id', resume).limit(1)
    : resumeQuery.order('created_at', { ascending: false }).limit(MAX_OPEN_SESSIONS)

  const [{ data: profile }, { data: completed }, { data: inProgress }] = await Promise.all([
    supabase.from('profiles').select('credits').eq('id', user.id).single(),
    supabase.from('review_sessions').select('score').eq('user_id', user.id).eq('status', 'completed'),
    resumeQuery,
  ])

  const scores = (completed ?? []).map((s) => s.score ?? 0)
  const honor = scores.reduce((sum, s) => sum + s, 0)

  const openSessions: InProgressSession[] = (inProgress ?? [])
    .filter((row) => Boolean(row.code))
    .map((row) => ({
      id: row.id,
      code: row.code!,
      scenario: row.scenario ?? '',
      language: row.language as InProgressSession['language'],
      issues: (row.issues as InProgressSession['issues']) ?? [],
      domain: (row.domain as InProgressSession['domain']) ?? 'general',
      context: row.context ?? null,
      annotations: (row.annotations as InProgressSession['annotations']) ?? [],
      generalNotes: row.general_notes ?? '',
      createdAt: row.created_at,
    }))

  return (
    <>
      {/* Phones can't fit the editor + annotation panel; show guidance instead. */}
      <SmallScreenNotice />

      <div className="hidden md:block">
        <DashboardClient
          userId={user.id}
          userEmail={user.email!}
          initialCredits={profile?.credits ?? 0}
          initialHonor={honor}
          initialReviews={scores.length}
          openSessions={openSessions}
          autoResume={Boolean(resume)}
        />
      </div>
    </>
  )
}
