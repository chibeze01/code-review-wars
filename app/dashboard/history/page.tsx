import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRankProgress, GRADE_COLORS, scoreColor } from '@/lib/ranks'
import { RankBadge } from '@/components/RankBadge'
import { AppNav } from '@/components/AppNav'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { data: sessions }, { data: allScores }] = await Promise.all([
    supabase.from('profiles').select('credits').eq('id', user.id).single(),
    supabase
      .from('review_sessions')
      .select('id, scenario, language, score, grade, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
    supabase.from('review_sessions').select('score').eq('user_id', user.id),
  ])

  const scores = (allScores ?? []).map((s) => s.score ?? 0)
  const honor = scores.reduce((sum, s) => sum + s, 0)
  const avg = scores.length > 0 ? Math.round(honor / scores.length) : 0
  const { rank, next, progress, honorToNext } = getRankProgress(honor)

  return (
    <div className="min-h-screen bg-cream text-ink">
      <AppNav credits={profile?.credits ?? 0} />

      <div className="max-w-3xl mx-auto px-[22px] py-10">
        <div className="font-display font-bold text-sm text-brand uppercase tracking-[0.08em] mb-3">
          the record
        </div>
        <h1 className="font-display font-extrabold leading-[1.04] text-4xl mb-8">
          Review <span className="mark-hi">history.</span>
        </h1>

        {/* Profile stats band */}
        <div className="card-pop p-5 mb-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-3">
            <RankBadge rank={rank} size="lg" />
            <div>
              <p className="font-display font-extrabold text-sm">{rank.title}</p>
              {next ? (
                <p className="text-[11px] text-ink-2 mt-0.5">
                  {honorToNext} honor to <span style={{ color: next.color }} className="font-bold">{next.label}</span>
                </p>
              ) : (
                <p className="text-[11px] font-bold text-coral mt-0.5">Highest rank achieved</p>
              )}
            </div>
          </div>
          {next && (
            <div className="flex-1 min-w-[140px]">
              <div className="w-full h-2.5 bg-cream-2 border-2 border-ink rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="font-display font-extrabold text-lg leading-none text-brand">{honor}</p>
              <p className="text-[10px] font-semibold text-ink-3 mt-1">honor</p>
            </div>
            <div className="text-center">
              <p className="font-display font-extrabold text-lg leading-none">{scores.length}</p>
              <p className="text-[10px] font-semibold text-ink-3 mt-1">reviews</p>
            </div>
            <div className="text-center">
              <p className="font-display font-extrabold text-lg leading-none">{avg}</p>
              <p className="text-[10px] font-semibold text-ink-3 mt-1">avg score</p>
            </div>
          </div>
        </div>

        {!sessions?.length ? (
          <div className="border-2 border-dashed border-ink/25 rounded-pop-lg p-12 text-center">
            <p className="text-sm text-ink-2 mb-5">No reviews yet. Your first bug is waiting. 🐛</p>
            <Link href="/dashboard/train" className="btn-pop btn-pop-green">
              First session →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3.5">
            {sessions.map((s) => {
              const gradeColor = GRADE_COLORS[s.grade] ?? '#57534e'
              return (
                <Link
                  key={s.id}
                  href={`/dashboard/history/${s.id}`}
                  className="card-pop !shadow-hard-sm p-4 flex items-center gap-4 transition-all hover:-translate-x-px hover:-translate-y-px hover:shadow-hard group"
                >
                  <div
                    className="w-12 h-12 border-2.5 border-ink rounded-[12px] bg-paper flex items-center justify-center font-display font-extrabold text-lg shrink-0"
                    style={{ color: gradeColor }}
                  >
                    {s.grade}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate group-hover:text-brand transition-colors">
                      {s.scenario ?? 'Code review session'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-display font-bold border-2 border-ink rounded-full px-2 py-0.5 bg-cream-2">
                        {s.language}
                      </span>
                      <span className="text-[11px] text-ink-3">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] font-mono font-bold text-brand">
                        +{s.score} honor
                      </span>
                    </div>
                  </div>
                  <div className="w-24 shrink-0 hidden sm:flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-ink-3">score</span>
                      <span className="text-xs font-mono font-bold">{s.score}</span>
                    </div>
                    <div className="w-full h-2 bg-cream-2 border-2 border-ink rounded-full overflow-hidden">
                      <div
                        className="h-full"
                        style={{ width: `${s.score}%`, background: scoreColor(s.score ?? 0) }}
                      />
                    </div>
                  </div>
                  <span className="text-ink-3 group-hover:text-brand transition-colors shrink-0">→</span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
