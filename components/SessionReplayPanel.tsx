'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AnnotatedCodeEditor } from './AnnotatedCodeEditor'
import { COMMENT_COLORS } from '@/lib/commentExtension'
import { GRADE_COLORS, scoreColor } from '@/lib/ranks'
import type { CodeComment, CodeIssue, EvaluationResult } from '@/types'

interface ReplayFeedback extends EvaluationResult {
  generatedIssues?: CodeIssue[]
  durationSeconds?: number | null
}

interface ReplaySession {
  id: string
  scenario: string | null
  language: string
  code: string | null
  annotations: CodeComment[] | null
  score: number | null
  grade: string | null
  feedback: ReplayFeedback | null
  created_at: string
}

interface Props {
  session: ReplaySession
}

export function SessionReplayPanel({ session }: Props) {
  const [codeOpen, setCodeOpen] = useState(false)

  const score = session.score ?? 0
  const grade = session.grade ?? 'F'
  const gradeColor = GRADE_COLORS[grade] ?? GRADE_COLORS['F']
  const fb = session.feedback
  const annotations = session.annotations ?? []
  const generatedIssues = fb?.generatedIssues ?? []

  const duration = fb?.durationSeconds
  const durationLabel = duration
    ? duration >= 60
      ? `${Math.floor(duration / 60)}m ${duration % 60}s`
      : `${duration}s`
    : null

  return (
    <div className="max-w-3xl mx-auto px-[22px] py-10">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/dashboard/history"
          className="text-ink-2 hover:text-brand transition-colors flex items-center gap-1.5 text-[13px] font-bold"
        >
          ← History
        </Link>
        <span className="text-ink-3">/</span>
        <span className="text-[13px] text-ink-3 font-mono">{session.language}</span>
      </div>

      <h1 className="font-display font-extrabold leading-[1.04] text-3xl mb-1">
        Session <span className="mark-hi">replay.</span>
      </h1>
      <p className="text-sm text-ink-2 mb-8">
        {new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        {durationLabel && <span className="ml-3 text-ink-3">· {durationLabel}</span>}
      </p>

      {/* Score card */}
      <div className="card-pop p-5 flex items-center gap-5 mb-5">
        <div
          className="shrink-0 w-20 h-20 rounded-full border-2.5 border-ink bg-paper shadow-hard flex items-center justify-center font-display font-extrabold text-3xl"
          style={{ color: gradeColor }}
        >
          {grade}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-3">Score</span>
            <span className="text-sm font-mono font-bold">{score}/100</span>
          </div>
          <div className="w-full h-3 bg-cream-2 border-2 border-ink rounded-full overflow-hidden">
            <div
              className="h-full"
              style={{ width: `${score}%`, background: scoreColor(score) }}
            />
          </div>
          {fb?.summary && <p className="mt-3 text-sm text-ink-2">{fb.summary}</p>}
        </div>
      </div>

      {/* Scenario */}
      {session.scenario && (
        <div className="card-pop !shadow-hard-sm border-l-[6px] border-l-brand px-4 py-3 mb-5">
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand mb-1">🎯 Scenario</p>
          <p className="text-sm text-ink-2 leading-relaxed">{session.scenario}</p>
        </div>
      )}

      {/* Code + annotations collapsible */}
      {session.code && (
        <div className="card-pop !shadow-hard-sm overflow-hidden mb-5">
          <button
            type="button"
            onClick={() => setCodeOpen((o) => !o)}
            className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-cream-2/60 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className={`text-ink-2 transition-transform inline-block ${codeOpen ? 'rotate-90' : ''}`}>▸</span>
              <span className="text-sm font-display font-bold">
                Code {annotations.length > 0 && `· ${annotations.length} annotation${annotations.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <span className="text-xs text-ink-3">{codeOpen ? 'Collapse' : 'Expand'}</span>
          </button>

          {codeOpen && (
            <div className="border-t-2.5 border-ink p-4 flex flex-col gap-4">
              <AnnotatedCodeEditor
                code={session.code}
                language={session.language as 'TypeScript' | 'C#'}
                initialComments={annotations}
                readOnly
              />
              {annotations.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2">Your Annotations</p>
                  {annotations.map((c) => {
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
            </div>
          )}
        </div>
      )}

      {/* Issues found / missed */}
      {fb && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-5">
          <div className="bg-brand-soft border-2.5 border-ink rounded-pop-lg shadow-hard p-4 flex flex-col gap-3">
            <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand-dark">
              ✅ Issues Found ({fb.issuesFound.length})
            </p>
            {fb.issuesFound.length === 0 ? (
              <p className="text-xs text-ink-2 italic">None correctly identified.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {fb.issuesFound.map((item, i) => (
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
              ❌ Issues Missed ({fb.issuesMissed.length})
            </p>
            {fb.issuesMissed.length === 0 ? (
              <p className="text-xs text-ink-2 italic">You caught everything! 🎉</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {fb.issuesMissed.map((item, i) => (
                  <li key={i} className="text-xs text-ink flex gap-2">
                    <span className="text-[#c2410c] font-bold shrink-0 mt-0.5">✗</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Coaching feedback */}
      {fb?.feedback && (
        <div className="card-pop p-4 flex flex-col gap-3 mb-5">
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand">🎓 Coaching feedback</p>
          <div className="text-sm text-ink-2 whitespace-pre-line leading-relaxed">{fb.feedback}</div>
        </div>
      )}

      {/* Ideal review */}
      {fb?.idealReview && (
        <details className="card-pop !shadow-hard-sm overflow-hidden group mb-5">
          <summary className="px-4 py-3 font-display font-bold text-sm cursor-pointer hover:bg-cream-2/60 transition-colors select-none list-none flex items-center justify-between [&::-webkit-details-marker]:hidden">
            <span>📖 Model Answer — Ideal Review</span>
            <span className="text-xl transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="px-4 pb-4 border-t-2.5 border-ink pt-3">
            <p className="text-sm text-ink-2 whitespace-pre-line leading-relaxed">{fb.idealReview}</p>
          </div>
        </details>
      )}

      {/* All intentional issues (only available for sessions recorded after this update) */}
      {generatedIssues.length > 0 && (
        <details className="card-pop !shadow-hard-sm overflow-hidden group mb-5">
          <summary className="px-4 py-3 font-display font-bold text-sm cursor-pointer hover:bg-cream-2/60 transition-colors select-none list-none flex items-center justify-between [&::-webkit-details-marker]:hidden">
            <span>🐛 All Intentional Issues ({generatedIssues.length})</span>
            <span className="text-xl transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="px-4 pb-4 border-t-2.5 border-ink pt-3 flex flex-col gap-2">
            {generatedIssues.map((issue, i) => (
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
      )}

      {/* CTA */}
      <Link href="/dashboard/train" className="btn-pop btn-pop-green">
        Back to training →
      </Link>
    </div>
  )
}
