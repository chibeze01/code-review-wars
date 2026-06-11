'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SessionSetupPanel } from './SessionSetupPanel'
import { CodeReviewSession } from './CodeReviewSession'
import { FeedbackPanel } from './FeedbackPanel'
import { RankBadge } from './RankBadge'
import { getRankProgress, type Rank } from '@/lib/ranks'
import type { AppPhase, GeneratedCode, EvaluationResult, Language, CodeComment } from '@/types'

interface Props {
  userId: string
  userEmail: string
  initialCredits: number
  initialHonor: number
  initialReviews: number
}

export function DashboardClient({ userEmail, initialCredits, initialHonor, initialReviews }: Props) {
  const [phase, setPhase] = useState<AppPhase>('setup')
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState(initialCredits)

  const [language, setLanguage] = useState<Language>('TypeScript')
  const [context, setContext] = useState('')

  const [generated, setGenerated] = useState<GeneratedCode | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [submittedComments, setSubmittedComments] = useState<CodeComment[]>([])
  const [submittedNotes, setSubmittedNotes] = useState('')

  const [honor, setHonor] = useState(initialHonor)
  const [reviews, setReviews] = useState(initialReviews)
  const [honorEarned, setHonorEarned] = useState(0)
  const [rankUp, setRankUp] = useState<Rank | null>(null)

  async function handleGenerate(lang: Language, ctx: string) {
    setLanguage(lang)
    setContext(ctx)
    setError(null)
    setPhase('generating')
    try {
      const res = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, context: ctx }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? `Error ${res.status}`)
      }
      const code = await res.json() as GeneratedCode
      setGenerated(code)
      setSubmittedComments([])
      setSubmittedNotes('')
      setEvaluation(null)
      setPhase('reviewing')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setPhase('setup')
    }
  }

  async function handleSubmitReview(comments: CodeComment[], generalNotes: string) {
    if (!generated) return
    setSubmittedComments(comments)
    setSubmittedNotes(generalNotes)
    setError(null)
    setPhase('evaluating')
    try {
      const res = await fetch('/api/evaluate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated, comments, generalNotes }),
      })
      if (!res.ok) {
        const data = await res.json()
        if (res.status === 402) {
          throw new Error('No credits remaining. Please purchase more to continue.')
        }
        throw new Error(data.error ?? `Error ${res.status}`)
      }
      const { evaluation: result, creditsRemaining } = await res.json()
      const prevRank = getRankProgress(honor).rank
      const newHonor = honor + result.score
      const newRank = getRankProgress(newHonor).rank
      setEvaluation(result)
      setCredits(creditsRemaining)
      setHonor(newHonor)
      setReviews((r) => r + 1)
      setHonorEarned(result.score)
      setRankUp(newRank.kyu !== prevRank.kyu ? newRank : null)
      setPhase('feedback')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setPhase('reviewing')
    }
  }

  async function handleNext() {
    if (!context) { setPhase('setup'); return }
    await handleGenerate(language, context)
  }

  function handleReset() {
    setPhase('setup')
    setGenerated(null)
    setSubmittedComments([])
    setSubmittedNotes('')
    setEvaluation(null)
    setError(null)
  }

  const isGenerating = phase === 'generating'
  const isEvaluating = phase === 'evaluating'

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      <header className="border-b border-[#21262d] bg-[#161b22] px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
            CR
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 leading-none">Code Review Wars</h1>
            <p className="text-xs text-slate-500 mt-0.5">Interview Practice</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-slate-500 hidden md:flex items-center gap-2">
            <span className="text-yellow-500 font-semibold">{honor}</span> honor
          </span>
          <Link
            href="/billing"
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors ${
              credits === 0
                ? 'text-red-400 border-red-500/30 bg-red-500/10 hover:bg-red-500/20'
                : credits <= 2
                ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10 hover:bg-yellow-500/20'
                : 'text-violet-400 border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20'
            }`}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
              <circle cx="4" cy="4" r="4" />
            </svg>
            {credits} credit{credits !== 1 ? 's' : ''}
          </Link>
          <span className="text-xs text-slate-500 hidden sm:block">{userEmail}</span>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="text-xs text-slate-600 hover:text-slate-300 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>
        <aside className="w-80 shrink-0 border-r border-[#21262d] bg-[#161b22] overflow-y-auto p-5 flex flex-col gap-5">
          {(() => {
            const { rank, next, progress, honorToNext } = getRankProgress(honor)
            return (
              <div className="bg-[#0d1117] border border-[#21262d] rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <RankBadge rank={rank} size="lg" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-200 truncate">{rank.title}</p>
                    <p className="text-xs text-slate-500">
                      <span className="text-yellow-500 font-semibold">{honor}</span> honor
                    </p>
                  </div>
                </div>
                {next && (
                  <div className="mt-3">
                    <div className="w-full h-1.5 bg-[#21262d] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.round(progress * 100)}%`, backgroundColor: next.color }}
                      />
                    </div>
                    <p className="text-[11px] text-slate-600 mt-1.5">
                      {honorToNext} honor to <span style={{ color: next.color }}>{next.label}</span>
                    </p>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-[#21262d] grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-base font-bold text-slate-200 leading-none">{reviews}</p>
                    <p className="text-[11px] text-slate-600 mt-1">reviews</p>
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-200 leading-none">
                      {reviews > 0 ? Math.round(honor / reviews) : '—'}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">avg score</p>
                  </div>
                </div>
              </div>
            )
          })()}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Session Setup</h2>
            <SessionSetupPanel onGenerate={handleGenerate} loading={isGenerating} credits={credits} />
          </div>

          {phase !== 'setup' && (
            <div className="mt-4 border-t border-[#21262d] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">Progress</p>
              <div className="flex flex-col gap-1.5">
                {(
                  [
                    { key: 'generating', label: '1. Generate Code' },
                    { key: 'reviewing',  label: '2. Annotate & Review' },
                    { key: 'evaluating', label: '3. Evaluating' },
                    { key: 'feedback',   label: '4. See Results' },
                  ] as { key: AppPhase; label: string }[]
                ).map(({ key, label }) => {
                  const order: AppPhase[] = ['generating', 'reviewing', 'evaluating', 'feedback']
                  const isDone   = order.indexOf(key) < order.indexOf(phase)
                  const isActive = key === phase
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 text-xs py-0.5 ${
                        isActive ? 'text-violet-400' : isDone ? 'text-slate-500' : 'text-slate-700'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isActive ? 'bg-violet-400' : isDone ? 'bg-slate-600' : 'bg-slate-800'
                      }`} />
                      {label}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {phase === 'reviewing' && (
            <div className="mt-auto border-t border-[#21262d] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">How to annotate</p>
              <ol className="flex flex-col gap-2">
                {[
                  'Select any lines in the code editor',
                  'An annotation form appears inline',
                  'Type what you think the issue is',
                  '⌘+Enter or click Save',
                  'Repeat for every issue you find',
                  'Add general notes below, then Submit',
                ].map((step, i) => (
                  <li key={i} className="text-xs text-slate-600 flex gap-2">
                    <span className="text-slate-700 shrink-0 font-mono">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-auto border-t border-[#21262d] pt-4">
            <Link
              href="/dashboard/history"
              className="flex items-center gap-2 text-xs text-slate-600 hover:text-slate-300 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              View review history
            </Link>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 flex items-start gap-2">
              <svg className="shrink-0 mt-0.5 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
              {error.toLowerCase().includes('credit') && (
                <Link href="/billing" className="ml-auto text-violet-400 hover:text-violet-300 shrink-0 text-xs">
                  Buy credits →
                </Link>
              )}
            </div>
          )}

          {(phase === 'setup' || isGenerating) && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4">
              {isGenerating ? (
                <>
                  <div className="w-12 h-12 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
                  <p className="text-slate-400 text-sm">Generating your code review challenge…</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-2">🔍</div>
                  <h2 className="text-xl font-bold text-slate-200">Ready to practice?</h2>
                  <p className="text-slate-500 text-sm max-w-md">
                    Choose a language and scenario in the sidebar, then generate a code snippet.
                    Annotate lines directly in the editor and submit for AI evaluation.
                  </p>
                  {credits === 0 && (
                    <div className="mt-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-sm text-yellow-400">
                      You have no credits remaining.{' '}
                      <Link href="/billing" className="underline hover:text-yellow-300">Buy more to continue.</Link>
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-4 gap-3 max-w-lg w-full">
                    {[
                      { icon: '⚡', label: 'Real code',    sub: 'Production-style snippets' },
                      { icon: '🐛', label: 'Hidden bugs',  sub: 'Subtle, realistic issues' },
                      { icon: '💬', label: 'Inline notes', sub: 'Annotate specific lines' },
                      { icon: '🎯', label: 'AI grading',   sub: 'Detailed feedback' },
                    ].map((item) => (
                      <div key={item.label} className="bg-[#161b22] border border-[#30363d] rounded-lg p-3 text-center">
                        <div className="text-xl mb-1">{item.icon}</div>
                        <p className="text-xs font-semibold text-slate-300">{item.label}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {(phase === 'reviewing' || isEvaluating) && generated && (
            <CodeReviewSession
              generated={generated}
              onSubmit={handleSubmitReview}
              loading={isEvaluating}
            />
          )}

          {phase === 'feedback' && evaluation && generated && (
            <FeedbackPanel
              result={evaluation}
              generated={generated}
              comments={submittedComments}
              generalNotes={submittedNotes}
              honorEarned={honorEarned}
              rankUp={rankUp}
              onNext={handleNext}
              onReset={handleReset}
            />
          )}
        </main>
      </div>
    </div>
  )
}
