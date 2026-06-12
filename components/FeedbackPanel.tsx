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
        <div
          className="border-2 px-5 py-4 flex items-center gap-4 bg-[#101010]"
          style={{ borderColor: rankUp.color }}
        >
          <RankBadge rank={rankUp} size="lg" />
          <div>
            <p className="text-sm font-bold text-slate-100">Rank up!</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              You&apos;ve been promoted to <span style={{ color: rankUp.color }} className="font-semibold">{rankUp.label} — {rankUp.title}</span>
            </p>
          </div>
        </div>
      )}

      <div className="bg-[#101010] border border-white/10 p-5 flex items-center gap-5">
        <div
          className="shrink-0 w-20 h-20 border-2 bg-[#0a0a0a] flex items-center justify-center text-3xl font-black"
          style={{ borderColor: gradeColor, color: gradeColor }}
        >
          {result.grade}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Score</span>
            <span className="text-sm font-mono font-semibold text-neutral-200 flex items-center gap-2">
              {typeof honorEarned === 'number' && honorEarned > 0 && (
                <span className="text-xs font-sans font-black uppercase italic bg-[#ccff00] text-black px-2 py-0.5 -skew-x-6">
                  <span className="inline-block skew-x-6">+{honorEarned} honor</span>
                </span>
              )}
              {result.score}/100
            </span>
          </div>
          <div className="w-full h-2 bg-white/10 overflow-hidden">
            <div
              className="h-full transition-all duration-700"
              style={{ width: `${result.score}%`, background: scoreColor(result.score) }}
            />
          </div>
          <p className="mt-3 text-sm text-neutral-400">{result.summary}</p>
        </div>
      </div>

      <div className="bg-[#101010] border border-white/10 overflow-hidden">
        <button
          type="button"
          onClick={() => setCodeOpen((o) => !o)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg
              className={`w-4 h-4 text-neutral-500 transition-transform ${codeOpen ? 'rotate-90' : ''}`}
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-sm font-semibold text-neutral-300">
              Code Reference {comments.length > 0 && `· ${comments.length} annotation${comments.length !== 1 ? 's' : ''}`}
            </span>
          </div>
          <span className="text-xs text-neutral-600">
            {codeOpen ? 'Collapse' : 'Expand to see code + your annotations'}
          </span>
        </button>

        {codeOpen && (
          <div className="border-t border-white/10 p-4 flex flex-col gap-4">
            <AnnotatedCodeEditor
              code={generated.code}
              language={generated.language}
              initialComments={comments}
              readOnly
            />
            {comments.length > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Your Annotations</p>
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
            {generalNotes && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">General Notes You Submitted</p>
                <p className="text-xs text-neutral-400 leading-relaxed font-mono bg-[#0a0a0a] rounded px-3 py-2 whitespace-pre-wrap">
                  {generalNotes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="bg-[#101010] border border-white/10 p-4 flex flex-col gap-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ccff00] flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Issues Found ({result.issuesFound.length})
          </p>
          {result.issuesFound.length === 0 ? (
            <p className="text-xs text-neutral-600 italic">None correctly identified.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {result.issuesFound.map((item, i) => (
                <li key={i} className="text-xs text-neutral-300 flex gap-2">
                  <span className="text-[#ccff00] shrink-0 mt-0.5">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-[#101010] border border-white/10 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Issues Missed ({result.issuesMissed.length})
          </p>
          {result.issuesMissed.length === 0 ? (
            <p className="text-xs text-neutral-500 italic">You caught everything!</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {result.issuesMissed.map((item, i) => (
                <li key={i} className="text-xs text-neutral-300 flex gap-2">
                  <span className="text-red-500 shrink-0 mt-0.5">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {result.falsePositives.length > 0 && (
        <div className="bg-[#101010] border border-white/10 p-4 flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-yellow-400">
            False Positives ({result.falsePositives.length})
          </p>
          <ul className="flex flex-col gap-2">
            {result.falsePositives.map((item, i) => (
              <li key={i} className="text-xs text-neutral-300 flex gap-2">
                <span className="text-yellow-500 shrink-0 mt-0.5">!</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-[#101010] border border-white/10 p-4 flex flex-col gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#ccff00]">Coaching feedback</p>
        <div className="text-sm text-neutral-300 whitespace-pre-line leading-relaxed">{result.feedback}</div>
      </div>

      <details className="bg-[#101010] border border-white/10 overflow-hidden group">
        <summary className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 cursor-pointer hover:text-neutral-200 transition-colors select-none list-none flex items-center justify-between">
          <span>Model Answer — Ideal Review</span>
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <div className="px-4 pb-4 border-t border-white/10 pt-3">
          <p className="text-sm text-neutral-300 whitespace-pre-line leading-relaxed">{result.idealReview}</p>
        </div>
      </details>

      <details className="bg-[#101010] border border-white/10 overflow-hidden group">
        <summary className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 cursor-pointer hover:text-neutral-200 transition-colors select-none list-none flex items-center justify-between">
          <span>All Intentional Issues ({generated.issues.length})</span>
          <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </summary>
        <div className="px-4 pb-4 border-t border-white/10 pt-3 flex flex-col gap-2">
          {generated.issues.map((issue, i) => (
            <div key={i} className="flex items-start gap-3 text-xs">
              <span className={`shrink-0 px-1.5 py-0.5 rounded font-semibold uppercase ${
                issue.severity === 'critical' ? 'bg-red-500/20 text-red-400' :
                issue.severity === 'major'    ? 'bg-orange-500/20 text-orange-400' :
                                               'bg-slate-500/20 text-neutral-400'
              }`}>{issue.severity}</span>
              <div>
                <span className="text-neutral-500 mr-1">[{issue.type}]</span>
                <span className="text-neutral-300">{issue.description}</span>
                <span className="text-neutral-600 ml-1">— {issue.lineHint}</span>
              </div>
            </div>
          ))}
        </div>
      </details>

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onNext}
          className="flex-1 py-3.5 bg-[#ccff00] hover:bg-[#b9eb00] text-black font-black uppercase italic tracking-tight text-sm -skew-x-6 transition-all"
        >
          <span className="inline-block skew-x-6">Next code →</span>
        </button>
        <button
          type="button"
          onClick={onReset}
          className="py-3.5 px-6 border border-white/20 hover:border-white/50 text-neutral-400 hover:text-white font-black uppercase italic tracking-tight text-sm -skew-x-6 transition-all"
        >
          <span className="inline-block skew-x-6">New session</span>
        </button>
      </div>
    </div>
  )
}
