import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRankProgress, GRADE_COLORS, scoreColor } from '@/lib/ranks'
import { RankBadge } from '@/components/RankBadge'
import { AppNav } from '@/components/AppNav'

const VOLT = '#ccff00'
const RED = '#cf0a2c'

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
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f3]">
      <AppNav credits={profile?.credits ?? 0} />

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="h-px w-10" style={{ background: VOLT }} />
          <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: VOLT }}>
            The record
          </span>
        </div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8">
          Review history<span style={{ color: VOLT }}>.</span>
        </h1>

        {/* Profile stats band */}
        <div className="border border-white/10 bg-[#101010] p-5 mb-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-3">
            <RankBadge rank={rank} size="lg" />
            <div>
              <p className="text-sm font-black uppercase italic tracking-tight">{rank.title}</p>
              {next ? (
                <p className="text-[11px] text-neutral-600 mt-0.5">
                  {honorToNext} honor to <span style={{ color: next.color }} className="font-bold">{next.label}</span>
                </p>
              ) : (
                <p className="text-[11px] mt-0.5" style={{ color: RED }}>Highest rank achieved</p>
              )}
            </div>
          </div>
          {next && (
            <div className="flex-1 min-w-[140px]">
              <div className="w-full h-1.5 bg-white/10 overflow-hidden">
                <div
                  className="h-full"
                  style={{ width: `${Math.round(progress * 100)}%`, background: `linear-gradient(90deg, ${VOLT}, ${next.color})` }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-lg font-black italic leading-none" style={{ color: VOLT }}>{honor}</p>
              <p className="text-[10px] uppercase tracking-widest text-neutral-600 mt-1">honor</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black italic leading-none text-neutral-100">{scores.length}</p>
              <p className="text-[10px] uppercase tracking-widest text-neutral-600 mt-1">reviews</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-black italic leading-none text-neutral-100">{avg}</p>
              <p className="text-[10px] uppercase tracking-widest text-neutral-600 mt-1">avg score</p>
            </div>
          </div>
        </div>

        {!sessions?.length ? (
          <div className="border border-dashed border-white/15 p-12 text-center">
            <p className="text-sm text-neutral-500 mb-5">No reviews yet. The dojo is waiting.</p>
            <Link
              href="/dashboard/train"
              className="inline-block bg-[#ccff00] hover:bg-[#b9eb00] text-black px-6 py-3 text-sm font-black uppercase italic tracking-tight -skew-x-6 transition-all"
            >
              <span className="inline-block skew-x-6">First session →</span>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => {
              const gradeColor = GRADE_COLORS[s.grade] ?? '#8a8a8a'
              return (
                <Link
                  key={s.id}
                  href={`/dashboard/history/${s.id}`}
                  className="bg-[#101010] border border-white/10 p-4 flex items-center gap-4 transition-colors hover:border-[#ccff00]/40 hover:bg-[#ccff00]/5 group"
                >
                  <div
                    className="w-12 h-12 border-2 bg-[#0a0a0a] flex items-center justify-center text-lg font-black shrink-0"
                    style={{ borderColor: gradeColor, color: gradeColor }}
                  >
                    {s.grade}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-neutral-200 truncate">
                      {s.scenario ?? 'Code review session'}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 border border-white/15 px-1.5 py-0.5">
                        {s.language}
                      </span>
                      <span className="text-[11px] text-neutral-600">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-[11px] font-black italic" style={{ color: VOLT }}>
                        +{s.score} honor
                      </span>
                    </div>
                  </div>
                  <div className="w-24 shrink-0 hidden sm:flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-600">score</span>
                      <span className="text-xs font-mono font-bold text-neutral-300">{s.score}</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/10 overflow-hidden">
                      <div
                        className="h-full"
                        style={{ width: `${s.score}%`, background: scoreColor(s.score ?? 0) }}
                      />
                    </div>
                  </div>
                  <svg className="w-4 h-4 text-neutral-700 group-hover:text-[#ccff00] transition-colors shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
