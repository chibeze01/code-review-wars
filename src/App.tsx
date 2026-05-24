import { useState } from 'react'
import { SetupPanel } from './components/SetupPanel'
import { CodeReviewSession } from './components/CodeReviewSession'
import { FeedbackPanel } from './components/FeedbackPanel'
import { generateCode, evaluateReview } from './lib/claude'
import type { AppPhase, GeneratedCode, EvaluationResult, Language, CodeComment } from './types'

export default function App() {
  const [phase, setPhase] = useState<AppPhase>('setup')
  const [error, setError] = useState<string | null>(null)

  const [apiKey, setApiKey] = useState('')
  const [language, setLanguage] = useState<Language>('TypeScript')
  const [context, setContext] = useState('')

  const [generated, setGenerated] = useState<GeneratedCode | null>(null)
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null)

  // Persist the submitted review so FeedbackPanel can show it
  const [submittedComments, setSubmittedComments] = useState<CodeComment[]>([])
  const [submittedNotes, setSubmittedNotes] = useState('')

  const [sessionCount, setSessionCount] = useState(0)

  async function handleGenerate(key: string, lang: Language, ctx: string) {
    setApiKey(key)
    setLanguage(lang)
    setContext(ctx)
    setError(null)
    setPhase('generating')
    try {
      const code = await generateCode(key, lang, ctx)
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
      const result = await evaluateReview(apiKey, generated, comments, generalNotes)
      setEvaluation(result)
      setSessionCount((c) => c + 1)
      setPhase('feedback')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
      setPhase('reviewing')
    }
  }

  async function handleNext() {
    if (!apiKey || !context) {
      setPhase('setup')
      return
    }
    setError(null)
    setPhase('generating')
    try {
      const code = await generateCode(apiKey, language, context)
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
      {/* Header */}
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
        {sessionCount > 0 && (
          <div className="text-xs text-slate-500">
            <span className="text-violet-400 font-semibold">{sessionCount}</span>{' '}
            review{sessionCount !== 1 ? 's' : ''} completed
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>
        {/* Sidebar */}
        <aside className="w-80 shrink-0 border-r border-[#21262d] bg-[#161b22] overflow-y-auto p-5 flex flex-col gap-5">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">Session Setup</h2>
            <SetupPanel onGenerate={handleGenerate} loading={isGenerating} />
          </div>

          {/* Phase stepper */}
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
                      <div
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          isActive ? 'bg-violet-400' : isDone ? 'bg-slate-600' : 'bg-slate-800'
                        }`}
                      />
                      {label}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Inline-comment instructions (shown during review) */}
          {phase === 'reviewing' && (
            <div className="mt-auto border-t border-[#21262d] pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">How to annotate</p>
              <ol className="flex flex-col gap-2">
                {[
                  'Select any lines in the code editor',
                  'An annotation form appears on the right',
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
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400 flex items-start gap-2">
              <svg className="shrink-0 mt-0.5 w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
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
                    Enter your API key and scenario in the sidebar, then generate a code snippet.
                    Annotate lines directly in the editor and submit for AI evaluation.
                  </p>
                  <div className="mt-4 grid grid-cols-4 gap-3 max-w-lg w-full">
                    {[
                      { icon: '⚡', label: 'Real code',      sub: 'Production-style snippets' },
                      { icon: '🐛', label: 'Hidden bugs',    sub: 'Subtle, realistic issues' },
                      { icon: '💬', label: 'Inline notes',   sub: 'Annotate specific lines' },
                      { icon: '🎯', label: 'AI grading',     sub: 'Detailed feedback' },
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
              onNext={handleNext}
              onReset={handleReset}
            />
          )}
        </main>
      </div>
    </div>
  )
}
