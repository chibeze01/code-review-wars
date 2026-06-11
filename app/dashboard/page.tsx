import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardClient } from '@/components/DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: sessions }] = await Promise.all([
    supabase.from('profiles').select('credits').eq('id', user.id).single(),
    supabase.from('review_sessions').select('score').eq('user_id', user.id),
  ])

  const scores = (sessions ?? []).map((s) => s.score ?? 0)
  const honor = scores.reduce((sum, s) => sum + s, 0)

  return (
    <DashboardClient
      userId={user.id}
      userEmail={user.email!}
      initialCredits={profile?.credits ?? 0}
      initialHonor={honor}
      initialReviews={scores.length}
    />
  )
}
