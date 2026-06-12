import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'
import { SessionReplayPanel } from '@/components/SessionReplayPanel'

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: session }, { data: profile }] = await Promise.all([
    supabase
      .from('review_sessions')
      .select('id, scenario, language, code, annotations, score, grade, feedback, created_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single(),
    supabase.from('profiles').select('credits').eq('id', user.id).single(),
  ])

  if (!session) notFound()

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f3]">
      <AppNav credits={profile?.credits ?? 0} />
      <SessionReplayPanel session={session} />
    </div>
  )
}
