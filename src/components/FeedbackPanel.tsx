import { useState } from 'react'
import { AnnotatedCodeEditor } from './AnnotatedCodeEditor'
import { COMMENT_COLORS } from '../lib/commentExtension'
import type { EvaluationResult, GeneratedCode, CodeComment } from '../types'

const GRADE_COLORS: Record<string, string> = {
  A: 'text-emerald-400 border-emerald-500 bg-emerald-500/10',
  B: 'text-blue-400 border-blue-500 bg-blue-500/10',
  C: 'text-yellow-400 border-yellow-500 bg-yellow-500/10',
  D: 'text-orange-400 border-orange-500 bg-orangeald-500/10',
  F: 'text-red-400 border-red-500 bg-red-500/10',
}

function scoreBarColor(score: number) {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

interface Props {
  result: EvaluationResult
  generated: GeneratedCode
  comments: CodeComment[]
  generalNotes: string
  onNext: () => void
  onReset: () => void
}

export function FeedbackPanel({ result, generated, comments, generalNotes, onNext, onReset }: Props) {
  const [codeOpen, setCodeOpen] = useState(false)
  const gradeClass = GRADE_COLORS[result.grade] ?? GRADE_COLORS['F']

  return (
    <div className="flex flex-col gap-5">

      {/* ── Score header ── */}
      <div className="bg-[#1c2128] border border-[#30363d] rounded-xl p-5 flex items-center gap-5">
        <div className={`shrink-0 w-20 h-20 rounded-full border-2 flex items-center justify-center text-3xl font-bold ${gradeClass}`}>
          {result.grade}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-slate-300">Score</span>
            <span className="text-sm font-mono font-semibold text-slate-200">{result.score}/100</span>
          </div>
          <div className="w-full h-2 bg-[#0d1117] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(result.score)}`}
              style={{ width: `${result.score}%` }}
            />
          </div>
          <p className="mt-3 text-sm text-slate-400">{result.summary}</p>
        </div>
      </div>

      {/* ── Code reference accordion ── */}
      <div className="bg-[#1c2128] border border-[#30363d] rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setCodeOpen((o) => !o)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#21262d] transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-slate-500 transition-transform ${codeOpen ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-sm font-semibold text-slate-300">
              Code Reference {comments.length > 0 && `· ${comments.length} annotation${comments.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <span className="text-xs text-slate-600">
            {codeOpen ? 'Collapse' : 'Expand to see code + your annotations'}
          </span>
        </button>

        {codeOpen && (
          <div className="border-t border-[#30363d] p-4 flex flex-col gap-4">
            {/* Annotated code */}
            <AnnotatedCodeEditor
              code={generated.code}
              language={generated.language}
              initialComments={comments}
              readOnly
            />

            {/* Annotations legend */}
            {comments.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Your Annotations</p>
                {comments.map((c) => {
                  const col = COMMENT_COLORS[c.colorIndex % COMMENT_COLORS.length]
                  return (
                    <div
                      key={c.id}
                      className="rounded-lg px-3 py-2 flex gap-3 text-xs items-start"
                      style={{ backgroundColor: col.bg, border: `1px solid ${col.border}40` }}
                    >
                      <span
                        className="font-mono font-semibold shrink-0 px-1.5 py-0.5 rounded"
                        style={{ color: col.text, backgroundColor: `${col.border}25` }}
                      >
                        L{c.startLine}{c.startLine !== c.endLine ? `–${c.endLine}` : ''}
                      </span>
                      <span style={{ color: col.text }} className="leading-relaxed">{c.comment}</span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* General notes */}
            {generalNotes && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">General Notes You Submitted</p>
                <p className="text-xs text-slate-400 leading-relaxed font-mono bg-[#0d1117] rounded px-3 py-2 whitespace-pre-wrap">
                  {generalNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Issues grid ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Issues Found ({result.issuesFound.length})
          </p>
          {result.issuesFound.length === 0 ? (
            <p className="text-xs text-slate-600 italic">None correctly identified.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {result.issuesFound.map((item, i) => (
                <li key={i} className="text-xs text-slate-300 flex gap-2">
                  <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Issues Missed ({result.issuesMissed.length})
          </p>
          {result.issuesMissed.length === 0 ? (
            <p className="text-xs text-slate-500 italic">You caught everything!</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {result.issuesMissed.map((item, i) => (
                <li key={i} className="text-xs text-slate-300 flex gap-2">
                  <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* False positives */}
      {result.falsePositives.length > 0 && (
        <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
            False Positives — Things that aren't actually issues ({result.falsePositives.length})
          </p>
          <ul className="flex flex-col gap-2">
            {result.falsePositives.map((item, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-2">
                <span className="text-yellow-500 shrink-0 mt-0.5">!</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coaching feedback */}
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg p-4 flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-400">Coaching Feedback</p>
        <div className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{result.feedback}</div>
      </div>

      {/* Ideal review */}
      <details className="bg-[#1c2128] border border-[#30363d] rounded-lg overflow-hidden group">
        <summary className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-200 transition-colors select-none list-none flex items-center justify-between">
          <span>Model Answer — Ideal Review</span>
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <div className="px-4 pb-4 border-t border-[#30363d] pt-3">
          <p className="text-sm text-slate-300 whitespace-pre-line leading-relaxed">{result.idealReview}</p>
        </div>
      </details>

      {/* All intentional issues */}
      <details className="bg-[#1c2128] border border-[#30363d] rounded-lg overflow-hidden group">
        <summary className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-slate-200 transition-colors select-none list-none flex items-center justify-between">
          <span>All Intentional Issues ({generated.issues.length})</span>
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <div className="px-4 pb-4 border-t border-[#30363d] pt-3 flex flex-col gap-2">
          {generated.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <span className={`shrink-0 px-1.5 py-0.5 rounded font-semibold uppercase ${
                issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                issue.severity === 'major'    ? 'bg-orange-500/20 text-orange-400' :
                                               'bg-slate-500/20 text-slate-400'
              }`}>{issue.severity}</span>
              <div>
                <span className="text-slate-500 mr-1">[{issue.type}]</span>
                <span className="text-slate-300">{issue.description}</span>
                <span className="text-slate-600 ml-1">— {issue.lineHint}</span>
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors"
        >
          Next Code →
        </button>
        <button
          type="button"
          onClick={onReset}
          className="py-3 px-5 rounded-lg bg-[#1c2128] border border-[#30363d] hover:border-slate-500 text-slate-400 hover:text-slate-200 font-semibold text-sm transition-colors"
        >
          New Session
        </button>
      </div>
    </div>
  )
}
