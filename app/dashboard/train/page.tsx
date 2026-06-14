import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/DashboardClient'
import type { InProgressSession } from '@/types'

const RESUME_COLS = 'id, code, scenario, language, issues, domain, annotations, general_notes'

export default async function TrainPage({
  searchParams,
}: {
  searchParams: Promise<{ resume?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { resume } = await searchParams

  // The session to drop back into: a specific one (?resume=id) or, by default,
  // the most recent unfinished session.
  let resumeQuery = supabase
    .from('review_sessions')
    .select(RESUME_COLS)
    .eq('user_id', user.id)
    .eq('status', 'in_progress')
  resumeQuery = resume
    ? resumeQuery.eq('id', resume).limit(1)
    : resumeQuery.order('created_at', { ascending: false }).limit(1)

  const [{ data: profile }, { data: completed }, { data: inProgress }] = await Promise.all([
    supabase.from('profiles').select('credits').eq('id', user.id).single(),
    supabase.from('review_sessions').select('score').eq('user_id', user.id).eq('status', 'completed'),
    resumeQuery,
  ])

  const scores = (completed ?? []).map((s) => s.score ?? 0)
  const honor = scores.reduce((sum, s) => sum + s, 0)

  const row = inProgress?.[0]
  const initialSession: InProgressSession | null = row && row.code
    ? {
        id: row.id,
        code: row.code,
        scenario: row.scenario ?? '',
        language: row.language as InProgressSession['language'],
        issues: (row.issues as InProgressSession['issues']) ?? [],
        domain: (row.domain as InProgressSession['domain']) ?? 'general',
        annotations: (row.annotations as InProgressSession['annotations']) ?? [],
        generalNotes: row.general_notes ?? '',
      }
    : null

  return (
    <DashboardClient
      userId={user.id}
      userEmail={user.email!}
      initialCredits={profile?.credits ?? 0}
      initialHonor={honor}
      initialReviews={scores.length}
      initialSession={initialSession}
    />
  )
}
