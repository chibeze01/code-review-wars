import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'
import { DashboardOverview, type SessionSummary } from '@/components/DashboardOverview'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: sessions }] = await Promise.all([
    supabase.from('profiles').select('credits').eq('id', user.id).single(),
    supabase
      .from('review_sessions')
      .select('id, scenario, language, score, grade, created_at, issueResults:feedback->issueResults, durationSeconds:feedback->durationSeconds')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const summaries: SessionSummary[] = (sessions ?? []).map((s) => ({
    id: s.id,
    scenario: s.scenario,
    language: s.language,
    score: s.score ?? 0,
    grade: s.grade ?? 'F',
    createdAt: s.created_at,
    issueResults: Array.isArray(s.issueResults)
      ? (s.issueResults as { type: string; severity: string; found: boolean }[])
      : null,
    durationSeconds: typeof s.durationSeconds === 'number' ? s.durationSeconds : null,
  }))

  const credits = profile?.credits ?? 0

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f3]">
      <AppNav credits={credits} />
      <DashboardOverview email={user.email!} credits={credits} sessions={summaries} />
    </div>
  )
}
