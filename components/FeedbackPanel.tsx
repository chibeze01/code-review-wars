'use client'

import { useState } from 'react'
import { AnnotatedCodeEditor } from './AnnotatedCodeEditor'
import { RankBadge } from './RankBadge'
import { COMMENT_COLORS } from '@/lib/commentExtension'
import { GRADE_COLORS, scoreColor, type Rank } from '@/lib/ranks'
import type { EvaluationResult, GeneratedCode, CodeComment } from '@/types'

interface Props {
  result: EvaluationResult
  generated: GeneratedCode
  comments: CodeComment[]
  generalNotes: string
  honorEarned?: number
  rankUp?: Rank | null
  onNext: () => void
  onReset: () => void
}

export function FeedbackPanel({ result, generated, comments, generalNotes, honorEarned, rankUp, onNext, onReset }: Props) {
  const [codeOpen, setCodeOpen] = useState(false)
  const gradeColor = GRADE_COLORS[result.grade] ?? GRADE_COLORS['F']

  return (
    <div className="flex flex-col gap-5">
      {rankUp && (
        <div className="card-pop bg-hi-soft px-5 py-4 flex items-center gap-4">
          <RankBadge rank={rankUp} size="lg" />
          <div>
            <p className="font-display font-extrabold text-sm">🎉 Rank up!</p>
            <p className="text-xs text-ink-2 mt-0.5">
              You&apos;ve been promoted to <span style={{ color: rankUp.color }} className="font-bold">{rankUp.label} — {rankUp.title}</span>
            </p>
          </div>
        </div>
      )}

      {/* Score header */}
      <div className="card-pop p-5 flex items-center gap-5">
        <div
          className="shrink-0 w-20 h-20 rounded-full border-2.5 border-ink bg-paper shadow-hard flex items-center justify-center font-display font-extrabold text-3xl"
          style={{ color: gradeColor }}
        >
          {result.grade}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-3">Score</span>
            <span className="text-sm font-mono font-bold flex items-center gap-2">
              {typeof honorEarned === 'number' && honorEarned > 0 && (
                <span className="inline-flex items-center font-display font-bold text-xs bg-hi border-2 border-ink rounded-full px-2.5 py-0.5 shadow-hard-sm">
                  +{honorEarned} honor
                </span>
              )}
              {result.score}/100
            </span>
          </div>
          <div className="w-full h-3 bg-cream-2 border-2 border-ink rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${result.score}%`, background: scoreColor(result.score) }}
            />
          </div>
          <p className="mt-3 text-sm text-ink-2">{result.summary}</p>
        </div>
      </div>

      {/* Code reference (collapsible) */}
      <div className="card-pop !shadow-hard-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setCodeOpen((o) => !o)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-cream-2/60 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className={`text-ink-2 transition-transform inline-block ${codeOpen ? 'rotate-90' : ''}`}>▸</span>
            <span className="text-sm font-display font-bold">
              Code Reference {comments.length > 0 && `· ${comments.length} annotation${comments.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <span className="text-xs text-ink-3">
            {codeOpen ? 'Collapse' : 'Expand to see code + your annotations'}
          </span>
        </button>

        {codeOpen && (
          <div className="border-t-2.5 border-ink p-4 flex flex-col gap-4">
            <AnnotatedCodeEditor
              code={generated.code}
              language={generated.language}
              initialComments={comments}
              readOnly
            />
            {comments.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2">Your Annotations</p>
                {comments.map((c) => {
                  const col = COMMENT_COLORS[c.colorIndex % COMMENT_COLORS.length]
                  return (
                    <div
                      key={c.id}
                      className="rounded-lg px-3 py-2 flex gap-3 text-xs items-start"
                      style={{ backgroundColor: col.bg, border: `2px solid ${col.border}55` }}
                    >
                      <span
                        className="font-mono font-bold shrink-0 px-1.5 py-0.5 rounded"
                        style={{ color: col.text, backgroundColor: `${col.border}20` }}
                      >
                        L{c.startLine}{c.startLine !== c.endLine ? `–${c.endLine}` : ''}
                      </span>
                      <span style={{ color: col.text }} className="leading-relaxed">{c.comment}</span>
                    </div>
                  )
                })}
              </div>
            )}
            {generalNotes && (
              <div className="flex flex-col gap-1">
                <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2">General Notes You Submitted</p>
                <p className="text-xs text-ink-2 leading-relaxed font-mono bg-cream-2 rounded-lg px-3 py-2 whitespace-pre-wrap">
                  {generalNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Found / missed two-up */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-brand-soft border-2.5 border-ink rounded-pop-lg shadow-hard p-4 flex flex-col gap-3">
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand-dark">
            ✅ Issues Found ({result.issuesFound.length})
          </p>
          {result.issuesFound.length === 0 ? (
            <p className="text-xs text-ink-2 italic">None correctly identified.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {result.issuesFound.map((item, i) => (
                <li key={i} className="text-xs text-ink flex gap-2">
                  <span className="text-brand-dark font-bold shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-coral-soft border-2.5 border-ink rounded-pop-lg shadow-hard p-4 flex flex-col gap-3">
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-[#c2410c]">
            ❌ Issues Missed ({result.issuesMissed.length})
          </p>
          {result.issuesMissed.length === 0 ? (
            <p className="text-xs text-ink-2 italic">You caught everything! 🎉</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {result.issuesMissed.map((item, i) => (
                <li key={i} className="text-xs text-ink flex gap-2">
                  <span className="text-[#c2410c] font-bold shrink-0 mt-0.5">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {result.falsePositives.length > 0 && (
        <div className="bg-hi-soft border-2.5 border-ink rounded-pop-lg shadow-hard p-4 flex flex-col gap-3">
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-[#854d0e]">
            ⚠️ False Positives ({result.falsePositives.length})
          </p>
          <ul className="flex flex-col gap-2">
            {result.falsePositives.map((item, i) => (
              <li key={i} className="text-xs text-ink flex gap-2">
                <span className="text-[#854d0e] font-bold shrink-0 mt-0.5">!</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Coaching */}
      <div className="card-pop p-4 flex flex-col gap-3">
        <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand">🎓 Coaching feedback</p>
        <div className="text-sm text-ink-2 whitespace-pre-line leading-relaxed">{result.feedback}</div>
      </div>

      {/* Model answer */}
      <details className="card-pop !shadow-hard-sm overflow-hidden group">
        <summary className="px-4 py-3 font-display font-bold text-sm cursor-pointer hover:bg-cream-2/60 transition-colors select-none list-none flex items-center justify-between [&::-webkit-details-marker]:hidden">
          <span>📖 Model Answer — Ideal Review</span>
          <span className="text-xl transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="px-4 pb-4 border-t-2.5 border-ink pt-3">
          <p className="text-sm text-ink-2 whitespace-pre-line leading-relaxed">{result.idealReview}</p>
        </div>
      </details>

      {/* All planted issues */}
      <details className="card-pop !shadow-hard-sm overflow-hidden group">
        <summary className="px-4 py-3 font-display font-bold text-sm cursor-pointer hover:bg-cream-2/60 transition-colors select-none list-none flex items-center justify-between [&::-webkit-details-marker]:hidden">
          <span>🐛 All Intentional Issues ({generated.issues.length})</span>
          <span className="text-xl transition-transform group-open:rotate-45">+</span>
        </summary>
        <div className="px-4 pb-4 border-t-2.5 border-ink pt-3 flex flex-col gap-2">
          {generated.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <span className={`shrink-0 px-1.5 py-0.5 rounded-full border-2 border-ink font-display font-bold uppercase text-[10px] ${
                issue.severity === 'critical' ? 'bg-coral-soft text-[#c2410c]' :
                issue.severity === 'major'    ? 'bg-hi-soft text-[#854d0e]' :
                                               'bg-cream-2 text-ink-2'
              }`}>{issue.severity}</span>
              <div>
                <span className="text-ink-3 mr-1 font-mono">[{issue.type}]</span>
                <span className="text-ink">{issue.description}</span>
                <span className="text-ink-3 ml-1">— {issue.lineHint}</span>
              </div>
            </div>
          ))}
        </div>
      </details>

      {/* Actions */}
      <div className="flex gap-3.5 pt-1">
        <button type="button" onClick={onNext} className="btn-pop btn-pop-green flex-1">
          Next challenge · 1 credit →
        </button>
        <button type="button" onClick={onReset} className="btn-pop">
          New session
        </button>
      </div>
    </div>
  )
}
