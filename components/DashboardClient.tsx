'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { SessionSetupPanel } from './SessionSetupPanel'
import { CodeReviewSession } from './CodeReviewSession'
import { FeedbackPanel } from './FeedbackPanel'
import { RankBadge } from './RankBadge'
import { AppNav } from './AppNav'
import { getRankProgress, type Rank } from '@/lib/ranks'
import type {
  AppPhase, GeneratedCode, GenerateResponse, EvaluationResult,
  Language, Domain, CodeComment, InProgressSession,
} from '@/types'

interface Props {
  userId: string
  userEmail: string
  initialCredits: number
  initialHonor: number
  initialReviews: number
  // An unfinished session to drop straight back into (page reload / resume).
  initialSession?: InProgressSession | null
}

export function DashboardClient({ initialCredits, initialHonor, initialReviews, initialSession }: Props) {
  const [phase, setPhase] = useState<AppPhase>(initialSession ? 'reviewing' : 'setup')
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState(initialCredits)

  const [language, setLanguage] = useState<Language>(initialSession?.language ?? 'TypeScript')
  const [domain, setDomain] = useState<Domain>(initialSession?.domain ?? 'ecommerce')
  const [context, setContext] = useState<string | undefined>(undefined)

  const [generated, setGenerated] = useState<GeneratedCode | null>(
    initialSession
      ? {
          code: initialSession.code,
          scenario: initialSession.scenario,
          issues: initialSession.issues,
          language: initialSession.language,
        }
      : null,
  )
  const [sessionId, setSessionId] = useState<string | null>(initialSession?.id ?? null)
  const [resumeComments] = useState<CodeComment[]>(initialSession?.annotations ?? [])
  const [resumeNotes] = useState<string>(initialSession?.generalNotes ?? '')
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [submittedComments, setSubmittedComments] = useState<CodeComment[]>([])
  const [submittedNotes, setSubmittedNotes] = useState('')

  const [honor, setHonor] = useState(initialHonor)
  const [reviews, setReviews] = useState(initialReviews)
  const [honorEarned, setHonorEarned] = useState(0)
  const [rankUp, setRankUp] = useState<Rank | null>(null)
  const reviewStartRef = useRef<number | null>(initialSession ? Date.now() : null)

  // Debounced autosave of in-progress annotations/notes to the session row.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionIdRef = useRef<string | null>(initialSession?.id ?? null)
  sessionIdRef.current = sessionId

  function autosaveProgress(comments: CodeComment[], generalNotes: string) {
    const id = sessionIdRef.current
    if (!id) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      fetch(`/api/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ annotations: comments, generalNotes }),
      }).catch(() => {})
    }, 800)
  }

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
        if (res.status === 402) {
          throw new Error('No credits remaining. Please purchase more to continue.')
        }
        throw new Error(data.error ?? `Error ${res.status}`)
      }
      const data = await res.json() as GenerateResponse
      setGenerated({ code: data.code, scenario: data.scenario, issues: data.issues, language: data.language })
      setSessionId(data.sessionId)
      setCredits(data.creditsRemaining)   // a credit is spent at generation now
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
    if (!generated || !sessionId) return
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    setSubmittedComments(comments)
    setSubmittedNotes(generalNotes)
    setError(null)
    setPhase('evaluating')
    try {
      const res = await fetch('/api/evaluate-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
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
      setSessionId(null)   // session is now completed
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
    setSessionId(null)
    setSubmittedComments([])
    setSubmittedNotes('')
    setEvaluation(null)
    setError(null)
  }

  const isGenerating = phase === 'generating'
  const isEvaluating = phase === 'evaluating'

  return (
    <div className="h-screen bg-cream text-ink flex flex-col">
      <AppNav credits={credits} />

      <div className="flex flex-1 overflow-hidden min-h-0">
        <aside className="w-80 shrink-0 border-r-2.5 border-ink bg-cream-2/60 overflow-y-auto p-5 flex flex-col gap-5">
          {(() => {
            const { rank, next, progress, honorToNext } = getRankProgress(honor)
            return (
              <div className="card-pop p-4">
                <div className="flex items-center gap-3">
                  <RankBadge rank={rank} size="lg" />
                  <div className="min-w-0">
                    <p className="font-display font-extrabold text-sm truncate">{rank.title}</p>
                    <p className="text-xs text-ink-2">
                      <span className="text-brand font-bold">{honor}</span> honor
                    </p>
                  </div>
                </div>
                {next && (
                  <div className="mt-3">
                    <div className="w-full h-2.5 bg-cream-2 border-2 border-ink rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand transition-all duration-700"
                        style={{ width: `${Math.round(progress * 100)}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-ink-2 mt-1.5">
                      {honorToNext} honor to <span style={{ color: next.color }} className="font-bold">{next.label}</span>
                    </p>
                  </div>
                )}
                <div className="mt-3 pt-3 border-t-2 border-cream-2 grid grid-cols-2 gap-2">
                  <div>
                    <p className="font-display font-extrabold text-base leading-none">{reviews}</p>
                    <p className="text-[10px] font-semibold text-ink-3 mt-1">reviews</p>
                  </div>
                  <div>
                    <p className="font-display font-extrabold text-base leading-none">
                      {reviews > 0 ? Math.round(honor / reviews) : '—'}
                    </p>
                    <p className="text-[10px] font-semibold text-ink-3 mt-1">avg score</p>
                  </div>
                </div>
              </div>
            )
          })()}

          <div>
            <h2 className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2 mb-3">Session setup</h2>
            <SessionSetupPanel onGenerate={handleGenerate} loading={isGenerating} credits={credits} />
          </div>

          {phase !== 'setup' && (
            <div className="mt-4 border-t-2 border-ink/10 pt-4">
              <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2 mb-2">Progress</p>
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
                      className={`flex items-center gap-2 text-[13px] py-0.5 font-bold ${
                        isActive ? 'text-brand' : isDone ? 'text-ink-2' : 'text-ink-3'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full shrink-0 border-2 border-ink ${
                        isActive ? 'bg-brand' : isDone ? 'bg-ink-3' : 'bg-cream-2'
                      }`} />
                      {label} {isDone && '✓'}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {phase === 'reviewing' && (
            <div className="mt-auto bg-hi-soft border-2.5 border-ink rounded-pop p-4">
              <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] mb-2">💡 How to annotate</p>
              <ol className="flex flex-col gap-2">
                {[
                  'Select any lines in the code editor',
                  'An annotation form appears inline',
                  'Type what you think the issue is',
                  '⌘+Enter or click Save',
                  'Repeat for every issue you find',
                  'Add general notes below, then Submit',
                ].map((step, i) => (
                  <li key={i} className="text-xs text-ink-2 flex gap-2">
                    <span className="font-mono font-bold shrink-0">{i + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          <div className="mt-auto border-t-2 border-ink/10 pt-4">
            <Link
              href="/dashboard/history"
              className="flex items-center gap-2 text-[13px] font-bold text-ink-2 hover:text-brand transition-colors"
            >
              🕐 View review history
            </Link>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-5 border-2.5 border-ink rounded-pop bg-coral-soft px-4 py-3 text-sm font-medium flex items-start gap-2.5 shadow-hard-sm">
              <span>⚠️</span>
              <span>{error}</span>
              {error.toLowerCase().includes('credit') && (
                <Link href="/billing" className="ml-auto font-display font-bold text-brand hover:underline shrink-0 text-sm">
                  Top up →
                </Link>
              )}
            </div>
          )}

          {(phase === 'setup' || isGenerating) && (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center gap-4">
              {isGenerating ? (
                <>
                  <div className="w-12 h-12 rounded-full border-4 border-ink border-t-brand animate-spin" />
                  <p className="font-display font-bold text-ink-2">Generating your challenge…</p>
                </>
              ) : (
                <>
                  <div className="tag-pop">⚔️ The review arena</div>
                  <h2 className="font-display font-extrabold leading-[1.04] text-3xl md:text-4xl">
                    Ready to <span className="mark-hi">catch bugs?</span>
                  </h2>
                  <p className="text-ink-2 text-[15px] max-w-md leading-relaxed">
                    Choose a language and domain in the sidebar, then generate a code snippet.
                    Annotate lines directly in the editor and submit for AI evaluation.
                  </p>
                  {credits === 0 && (
                    <div className="mt-2 border-2.5 border-ink rounded-pop bg-coral-soft px-4 py-3 text-sm font-medium shadow-hard-sm">
                      You have no credits remaining.{' '}
                      <Link href="/billing" className="font-display font-bold text-brand hover:underline">Top up →</Link>
                    </div>
                  )}
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3.5 max-w-lg w-full">
                    {[
                      { icon: '⚡', label: 'Real code',    sub: 'Production-style snippets' },
                      { icon: '🐛', label: 'Hidden bugs',  sub: 'Subtle, realistic issues' },
                      { icon: '💬', label: 'Inline notes', sub: 'Annotate specific lines' },
                      { icon: '🎯', label: 'AI grading',   sub: 'Detailed feedback' },
                    ].map((item) => (
                      <div key={item.label} className="card-pop !shadow-hard-sm p-3 text-center">
                        <div className="text-xl mb-1">{item.icon}</div>
                        <p className="font-display font-bold text-xs">{item.label}</p>
                        <p className="text-[11px] text-ink-3 mt-0.5">{item.sub}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {(phase === 'reviewing' || isEvaluating) && generated && (
            <CodeReviewSession
              key={sessionId ?? 'none'}
              generated={generated}
              onSubmit={handleSubmitReview}
              loading={isEvaluating}
              initialComments={sessionId === initialSession?.id ? resumeComments : []}
              initialNotes={sessionId === initialSession?.id ? resumeNotes : ''}
              onProgress={autosaveProgress}
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
