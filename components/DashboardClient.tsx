'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { CodeReviewSession } from './CodeReviewSession'
import { FeedbackPanel } from './FeedbackPanel'
import { TrainSidebar } from './TrainSidebar'
import { ResumeSessionPrompt } from './ResumeSessionPrompt'
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
  // Every unfinished session the user can pick back up, newest first.
  openSessions?: InProgressSession[]
  // True when the user asked for one exact session (?resume=id, e.g. from
  // history) — that's explicit intent, so skip the resume prompt.
  autoResume?: boolean
}

export function DashboardClient({
  initialCredits, initialHonor, initialReviews, openSessions = [], autoResume = false,
}: Props) {
  // Landing on /dashboard/train with unfinished work asks first; only an
  // explicit ?resume=id drops straight back in.
  const resumeOnLoad = autoResume && openSessions.length > 0
  const firstSession = resumeOnLoad ? openSessions[0] : null

  // The session being reviewed, when it came from a resume rather than a fresh
  // generation. Its saved annotations/notes seed the editor.
  const [resumed, setResumed] = useState<InProgressSession | null>(firstSession)
  const [offers, setOffers] = useState<InProgressSession[]>(resumeOnLoad ? [] : openSessions)
  const [phase, setPhase] = useState<AppPhase>(resumeOnLoad ? 'reviewing' : 'setup')
  const [error, setError] = useState<string | null>(null)
  const [credits, setCredits] = useState(initialCredits)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const [language, setLanguage] = useState<Language>(firstSession?.language ?? 'TypeScript')
  const [domain, setDomain] = useState<Domain>(firstSession?.domain ?? 'ecommerce')
  // Restore the custom prompt so a resumed custom session's "Next challenge" works.
  const [context, setContext] = useState<string | undefined>(firstSession?.context ?? undefined)

  const [generated, setGenerated] = useState<GeneratedCode | null>(
    firstSession
      ? {
          code: firstSession.code,
          scenario: firstSession.scenario,
          issues: firstSession.issues,
          language: firstSession.language,
        }
      : null,
  )
  const [sessionId, setSessionId] = useState<string | null>(firstSession?.id ?? null)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)
  const [submittedComments, setSubmittedComments] = useState<CodeComment[]>([])
  const [submittedNotes, setSubmittedNotes] = useState('')

  const [honor, setHonor] = useState(initialHonor)
  const [reviews, setReviews] = useState(initialReviews)
  const [honorEarned, setHonorEarned] = useState(0)
  const [rankUp, setRankUp] = useState<Rank | null>(null)
  const reviewStartRef = useRef<number | null>(resumeOnLoad ? Date.now() : null)

  // Debounced autosave of in-progress annotations/notes to the session row.
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const sessionIdRef = useRef<string | null>(firstSession?.id ?? null)
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

  function handleResumeOffer(session: InProgressSession) {
    setResumed(session)
    setGenerated({
      code: session.code,
      scenario: session.scenario,
      issues: session.issues,
      language: session.language,
    })
    setSessionId(session.id)
    setLanguage(session.language)
    setDomain(session.domain)
    setContext(session.context ?? undefined)
    reviewStartRef.current = Date.now()
    setOffers([])
    setPhase('reviewing')
  }

  // Declining leaves the unfinished sessions alone in the DB — their credits are
  // already spent, so they stay resumable from history.
  function handleDeclineOffer() {
    setOffers([])
    setResumed(null)
    setGenerated(null)
    setSessionId(null)
    setPhase('setup')
  }

  async function handleGenerate(lang: Language, dom: Domain, ctx?: string) {
    setLanguage(lang)
    setDomain(dom)
    setContext(ctx)
    setError(null)
    setOffers([])
    setResumed(null)
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

  // Back to the picker. Any unfinished session is left as-is in the DB — its
  // credit is already spent, so it stays resumable.
  function handleReset() {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current)
    setPhase('setup')
    setOffers([])
    setResumed(null)
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
        <TrainSidebar
          collapsed={sidebarCollapsed}
          onToggleCollapsed={() => setSidebarCollapsed((c) => !c)}
          phase={phase}
          honor={honor}
          reviews={reviews}
          credits={credits}
          generating={isGenerating}
          language={language}
          domain={domain}
          context={context}
          onGenerate={handleGenerate}
          onNewSession={handleReset}
        />

        {/* Only the editor scrolls — the page itself never does. */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col p-5 gap-4">
          {error && (
            <div className="shrink-0 border-2.5 border-ink rounded-pop bg-coral-soft px-4 py-3 text-sm font-medium flex items-start gap-2.5 shadow-hard-sm">
              <span>⚠️</span>
              <span>{error}</span>
              {error.toLowerCase().includes('credit') && (
                <Link href="/billing" className="ml-auto font-display font-bold text-brand hover:underline shrink-0 text-sm">
                  Top up →
                </Link>
              )}
            </div>
          )}

          {phase === 'setup' && offers.length > 0 && (
            <div className="flex-1 min-h-0 overflow-y-auto">
              <ResumeSessionPrompt
                sessions={offers}
                onResume={handleResumeOffer}
                onStartNew={handleDeclineOffer}
              />
            </div>
          )}

          {((phase === 'setup' && offers.length === 0) || isGenerating) && (
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-col items-center justify-center text-center gap-4">
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
            <div className="flex-1 min-h-0">
              <CodeReviewSession
                key={sessionId ?? 'none'}
                generated={generated}
                onSubmit={handleSubmitReview}
                loading={isEvaluating}
                initialComments={sessionId === resumed?.id ? resumed.annotations : []}
                initialNotes={sessionId === resumed?.id ? resumed.generalNotes : ''}
                onProgress={autosaveProgress}
              />
            </div>
          )}

          {phase === 'feedback' && evaluation && generated && (
            <div className="flex-1 min-h-0 overflow-y-auto pr-1">
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
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
