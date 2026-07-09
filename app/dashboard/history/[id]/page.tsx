import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { AppNav } from '@/components/AppNav'
import { SessionReplayPanel } from '@/components/SessionReplayPanel'

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params
  const supabase = createAdminClient()
  const { data: session } = await supabase
    .from('review_sessions')
    .select('id, scenario, language, score, grade')
    .eq('id', id)
    .eq('status', 'completed')
    .single()

  if (!session) return { title: 'Session Result — Code Review Wars' }

  const grade = session.grade ?? 'F'
  const score = session.score ?? 0
  const language = session.language ?? 'TypeScript'
  const scenario = session.scenario ?? 'code review session'
  const title = `Grade ${grade} · ${score}/100 — Code Review Wars`
  const description = `${language} · ${scenario.slice(0, 120)} — reviewed on Code Review Wars`
  const imageUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/history/${id}/opengraph-image`

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/history/${id}`,
      siteName: 'Code Review Wars',
      title,
      description,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: `Grade ${grade} — ${score}/100 in ${language}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  }
}

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
    <div className="min-h-screen bg-cream text-ink">
      <AppNav credits={profile?.credits ?? 0} />
      <SessionReplayPanel session={session} />
    </div>
  )
}
