'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { SessionSetupPanel } from './SessionSetupPanel'
import { CodeReviewSession } from './CodeReviewSession'
import { FeedbackPanel } from './FeedbackPanel'
import { RankBadge } from './RankBadge'
import { AppNav } from './AppNav'
import { getRankProgress, type Rank } from '@/lib/ranks'
import type { AppPhase, GeneratedCode, EvaluationResult, Language, Domain, CodeComment } from '@/types'

interface Props {
  userId: string
  userEmail: string
  initialCredits: number
  initialHonor: number
  initialReviews: number
}

export function DashboardClient({ initialCredits, initialHonor, initialReviews }: Props) {
  const [phase, setPhase] = useState<AppPhase>('setup')
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState(initialCredits)

  const [language, setLanguage] = useState<Language>('TypeScript')
  const [domain, setDomain] = useState<Domain>('ecommerce')
  const [context, setContext] = useState<string | undefined>(undefined)

  const [generated, setGenerated] = useState<GeneratedCode | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [submittedComments, setSubmittedComments] = useState<CodeComment[]>([])
  const [submittedNotes, setSubmittedNotes] = useState('')

  const [honor, setHonor] = useState(initialHonor)
  const [reviews, setReviews] = useState(initialReviews)
  const [honorEarned, setHonorEarned] = useState(0)
  const [rankUp, setRankUp] = useState<Rank | null>(null)
  const reviewStartRef = useRef<number | null>(null)

  async function handleGenerate(lang: Language, dom: Domain, ctx?: string) {
    setLanguage(lang)
    setDomain(dom)
    setContext(ctx)
    setError(null)
    setPhase('generating')
    try {
      const res = await fetch('/api/generate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang, domain: dom, context: ctx }),
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
      reviewStartRef.current = Date.now()
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
        body: JSON.stringify({
          generated,
          comments,
          generalNotes,
          durationSeconds: reviewStartRef.current
            ? Math.round((Date.now() - reviewStartRef.current) / 1000)
            : undefined,
        }),
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
    await handleGenerate(language, domain, context)
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
    <div className="h-screen bg-[#0a0a0a] text-[#f5f5f3] flex flex-col">
      <AppNav credits={credits} />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <aside className="w-80 shrink-0 border-r border-white/10 bg-[#0d0d0d] overflow-y-auto p-5 flex flex-col gap-5">
          {(() => {
            const { rank, next, progress, honorToNext } = getRankProgress(honor)
            return (
              <div className="bg-[#101010] border border-white/10 p-4">
                <div className="flex items-center gap-3">
                  <RankBadge rank={rank} size="lg" />
                  <div className="min-w-0">
                    <p className="text-sm font-black uppercase italic tracking-tight truncate">{rank.title}</p>
                    <p className="text-xs text-neutral-500">
                      <span className="text-[#ccff00] font-bold">{honor}</span> honor
                    </p>
                  </div>
                </div>
                {next && (
                  <div className="mt-3">
                    <div className="w-full h-1.5 bg-white/10 overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{ width: `${Math.round(progress * 100)}%`, background: `linear-gradient(90deg, #ccff00, ${next.color})` }}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-1.5">
                      {honorToNext} honor to <span style={{ color: next.color }} className="font-bold">{next.label}</span>
                    </p>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-base font-black italic leading-none">{reviews}</p>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-600 mt-1">reviews</p>
                  </div>
                  <div>
                    <p className="text-base font-black italic leading-none">
                      {reviews > 0 ? Math.round(honor / reviews) : '—'}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-600 mt-1">avg score</p>
                  </div>
                </div>
              </div>
            )
          })()}

          <div>
            <h2 className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-3">Session setup</h2>
            <SessionSetupPanel onGenerate={handleGenerate} loading={isGenerating} credits={credits} />
          </div>

          {phase !== 'setup' && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-600 mb-2">Progress</p>
              <div className="flex flex-col gap-1.5">
                {(
                  [
                    { key: 'generating', label: '1. Generate code' },
                    { key: 'reviewing',  label: '2. Annotate & review' },
                    { key: 'evaluating', label: '3. Evaluating' },
                    { key: 'feedback',   label: '4. See results' },
                  ] as { key: AppPhase; label: string }[]
                ).map(({ key, label }) => {
                  const order: AppPhase[] = ['generating', 'reviewing', 'evaluating', 'feedback']
                  const isDone   = order.indexOf(key) < order.indexOf(phase)
                  const isActive = key === phase
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2 text-xs py-0.5 font-bold uppercase tracking-wider ${
                        isActive ? 'text-[#ccff00]' : isDone ? 'text-neutral-500' : 'text-neutral-700'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rotate-45 shrink-0 ${
                        isActive ? 'bg-[#ccff00]' : isDone ? 'bg-neutral-600' : 'bg-neutral-800'
                      }`} />
                      {label}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {phase === 'reviewing' && (
            <div className="mt-auto border-t border-white/10 pt-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-600 mb-2">How to annotate</p>
              <ol className="flex flex-col gap-2">
                {[
                  'Select any lines in the code editor',
                  'An annotation form appears inline',
                  'Type what you think the issue is',
                  '⌘+Enter or click Save',
                  'Repeat for every issue you find',
                  'Add general notes below, then Submit',
                ].map((step, i) => (
                  <li key={i} className="text-xs text-neutral-600 flex gap-2">
                    <span className="text-neutral-700 shrink-0 font-mono">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-auto border-t border-white/10 pt-4">
            <Link
              href="/dashboard/history"
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:text-[#ccff00] transition-colors"
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
            <div className="mb-5 border border-[#cf0a2c]/50 bg-[#cf0a2c]/10 px-4 py-3 text-sm text-[#ff5a73] flex items-start gap-2">
              <svg className="shrink-0 mt-0.5 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
              {error.toLowerCase().includes('credit') && (
                <Link href="/billing" className="ml-auto text-[#ccff00] hover:underline shrink-0 text-xs font-black uppercase italic">
                  Refuel →
                </Link>
              )}
            </div>
          )}

          {(phase === 'setup' || isGenerating) && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4">
              {isGenerating ? (
                <>
                  <div className="w-12 h-12 rounded-full border-2 border-[#ccff00] border-t-transparent animate-spin" />
                  <p className="text-neutral-400 text-sm uppercase tracking-wider font-bold">Generating your challenge…</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <span className="h-px w-10 bg-[#ccff00]" />
                    <span className="text-xs font-bold uppercase tracking-[0.3em] text-[#ccff00]">The dojo floor</span>
                    <span className="h-px w-10 bg-[#ccff00]" />
                  </div>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter">
                    Ready to practice<span className="text-[#ccff00]">?</span>
                  </h2>
                  <p className="text-neutral-500 text-sm max-w-md">
                    Choose a language and scenario in the sidebar, then generate a code snippet.
                    Annotate lines directly in the editor and submit for AI evaluation.
                  </p>
                  {credits === 0 && (
                    <div className="mt-2 border border-[#cf0a2c]/50 bg-[#cf0a2c]/10 px-4 py-3 text-sm text-[#ff5a73]">
                      You have no credits remaining.{' '}
                      <Link href="/billing" className="font-black uppercase italic text-[#ccff00] hover:underline">Refuel →</Link>
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-4 gap-3 max-w-lg w-full">
                    {[
                      { icon: '⚡', label: 'Real code',    sub: 'Production-style snippets' },
                      { icon: '🐛', label: 'Hidden bugs',  sub: 'Subtle, realistic issues' },
                      { icon: '💬', label: 'Inline notes', sub: 'Annotate specific lines' },
                      { icon: '🎯', label: 'AI grading',   sub: 'Detailed feedback' },
                    ].map((item) => (
                      <div key={item.label} className="bg-[#101010] border border-white/10 p-3 text-center hover:border-[#ccff00]/40 transition-colors">
                        <div className="text-xl mb-1">{item.icon}</div>
                        <p className="text-xs font-black uppercase italic tracking-tight text-neutral-200">{item.label}</p>
                        <p className="text-[11px] text-neutral-600 mt-0.5">{item.sub}</p>
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
