import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRankProgress } from '@/lib/ranks'
import { RankBadge } from '@/components/RankBadge'
import Link from 'next/link'

const GRADE_COLORS: Record<string, string> = {
  A: 'text-emerald-400 border-emerald-500',
  B: 'text-blue-400 border-blue-500',
  C: 'text-yellow-400 border-yellow-500',
  D: 'text-orange-400 border-orange-500',
  F: 'text-red-400 border-red-500',
}

function scoreBarColor(score: number) {
  if (score >= 80) return '#10b981'
  if (score >= 60) return '#3b82f6'
  if (score >= 40) return '#eab308'
  return '#ef4444'
}

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: sessions }, { data: allScores }] = await Promise.all([
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
    <div className="min-h-screen bg-[#0d1117]">
      <header className="border-b border-[#21262d] bg-[#161b22] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
            CR
          </div>
          <span className="text-base font-bold text-slate-100">Code Review Wars</span>
        </div>
        <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          ← Back to dashboard
        </Link>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Profile stats band */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 mb-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <div className="flex items-center gap-3">
            <RankBadge rank={rank} size="lg" />
            <div>
              <p className="text-sm font-bold text-slate-200">{rank.title}</p>
              {next ? (
                <p className="text-xs text-slate-600 mt-0.5">
                  {honorToNext} honor to <span style={{ color: next.color }}>{next.label}</span>
                </p>
              ) : (
                <p className="text-xs text-slate-600 mt-0.5">Highest rank achieved</p>
              )}
            </div>
          </div>
          {next && (
            <div className="flex-1 min-w-[140px]">
              <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: next.color }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-lg font-bold text-yellow-500 leading-none">{honor}</p>
              <p className="text-[11px] text-slate-600 mt-1">honor</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-200 leading-none">{scores.length}</p>
              <p className="text-[11px] text-slate-600 mt-1">reviews</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-200 leading-none">{avg}</p>
              <p className="text-[11px] text-slate-600 mt-1">avg score</p>
            </div>
          </div>
        </div>

        <h1 className="text-xl font-bold text-slate-100 mb-6">Review History</h1>

        {!sessions?.length ? (
          <div className="text-center py-16 text-slate-600">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">No reviews yet. Start training!</p>
            <Link href="/dashboard" className="mt-4 inline-block text-sm text-violet-400 hover:text-violet-300">
              Start a review →
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {sessions.map((s) => (
              <div
                key={s.id}
                className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex items-center gap-4"
              >
                <div className={`w-12 h-12 rounded-lg border-2 bg-[#0d1117] flex items-center justify-center text-lg font-bold shrink-0 ${
                  GRADE_COLORS[s.grade] ?? 'text-slate-400 border-slate-600'
                }`}>
                  {s.grade}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-200 truncate">
                    {s.scenario ?? 'Code review session'}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 bg-[#21262d] border border-[#30363d] rounded px-1.5 py-0.5">
                      {s.language}
                    </span>
                    <span className="text-xs text-slate-600">
                      {new Date(s.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs text-yellow-600 font-semibold">+{s.score} honor</span>
                  </div>
                </div>
                <div className="w-24 shrink-0 hidden sm:block">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-slate-600">score</span>
                    <span className="text-xs font-mono font-semibold text-slate-300">{s.score}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${s.score}%`, backgroundColor: scoreBarColor(s.score ?? 0) }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
