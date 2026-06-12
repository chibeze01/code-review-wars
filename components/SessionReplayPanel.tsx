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
    <div className="max-w-3xl mx-auto px-6 py-10">
      {/* Back + header */}
      <div className="flex items-center gap-3 mb-4">
        <Link
          href="/dashboard/history"
          className="text-neutral-600 hover:text-[#ccff00] transition-colors flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          History
        </Link>
        <span className="text-white/15">/</span>
        <span className="text-xs text-neutral-600 uppercase tracking-wider">{session.language}</span>
      </div>

      <h1 className="text-2xl font-black uppercase italic tracking-tighter mb-1">
        Session replay<span className="text-[#ccff00]">.</span>
      </h1>
      <p className="text-sm text-neutral-500 mb-8">
        {new Date(session.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
        {durationLabel && <span className="ml-3 text-neutral-600">· {durationLabel}</span>}
      </p>

      {/* Score card */}
      <div className="bg-[#101010] border border-white/10 p-5 flex items-center gap-5 mb-5">
        <div
          className="shrink-0 w-20 h-20 border-2 bg-[#0a0a0a] flex items-center justify-center text-3xl font-black"
          style={{ borderColor: gradeColor, color: gradeColor }}
        >
          {grade}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">Score</span>
            <span className="text-sm font-mono font-semibold text-neutral-200">{score}/100</span>
          </div>
          <div className="w-full h-2 bg-white/10 overflow-hidden">
            <div
              className="h-full"
              style={{ width: `${score}%`, background: scoreColor(score) }}
            />
          </div>
          {fb?.summary && <p className="mt-3 text-sm text-neutral-400">{fb.summary}</p>}
        </div>
      </div>

      {/* Scenario */}
      {session.scenario && (
        <div className="bg-[#101010] border border-white/10 border-l-2 border-l-[#ccff00] px-4 py-3 mb-5">
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#ccff00] mb-1">Scenario</p>
          <p className="text-sm text-neutral-300 leading-relaxed">{session.scenario}</p>
        </div>
      )}

      {/* Code + annotations collapsible */}
      {session.code && (
        <div className="bg-[#101010] border border-white/10 overflow-hidden mb-5">
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
                Code {annotations.length > 0 && `· ${annotations.length} annotation${annotations.length !== 1 ? 's' : ''}`}
              </span>
            </div>
            <span className="text-xs text-neutral-600">{codeOpen ? 'Collapse' : 'Expand'}</span>
          </button>

          {codeOpen && (
            <div className="border-t border-white/10 p-4 flex flex-col gap-4">
              <AnnotatedCodeEditor
                code={session.code}
                language={session.language as 'TypeScript' | 'C#'}
                initialComments={annotations}
                readOnly
              />
              {annotations.length > 0 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Your Annotations</p>
                  {annotations.map((c) => {
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
            </div>
          )}
        </div>
      )}

      {/* Issues found / missed */}
      {fb && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mb-5">
          <div className="bg-[#101010] border border-white/10 p-4 flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-widest text-[#ccff00] flex items-center gap-1.5">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Issues Found ({fb.issuesFound.length})
            </p>
            {fb.issuesFound.length === 0 ? (
              <p className="text-xs text-neutral-600 italic">None correctly identified.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {fb.issuesFound.map((item, i) => (
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
              Issues Missed ({fb.issuesMissed.length})
            </p>
            {fb.issuesMissed.length === 0 ? (
              <p className="text-xs text-neutral-500 italic">You caught everything!</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {fb.issuesMissed.map((item, i) => (
                  <li key={i} className="text-xs text-neutral-300 flex gap-2">
                    <span className="text-red-500 shrink-0 mt-0.5">✗</span>
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
        <div className="bg-[#101010] border border-white/10 p-4 flex flex-col gap-3 mb-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[#ccff00]">Coaching feedback</p>
          <div className="text-sm text-neutral-300 whitespace-pre-line leading-relaxed">{fb.feedback}</div>
        </div>
      )}

      {/* Ideal review */}
      {fb?.idealReview && (
        <details className="bg-[#101010] border border-white/10 overflow-hidden group mb-5">
          <summary className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 cursor-pointer hover:text-neutral-200 transition-colors select-none list-none flex items-center justify-between">
            <span>Model Answer — Ideal Review</span>
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div className="px-4 pb-4 border-t border-white/10 pt-3">
            <p className="text-sm text-neutral-300 whitespace-pre-line leading-relaxed">{fb.idealReview}</p>
          </div>
        </details>
      )}

      {/* All intentional issues (only available for sessions recorded after this update) */}
      {generatedIssues.length > 0 && (
        <details className="bg-[#101010] border border-white/10 overflow-hidden group mb-5">
          <summary className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-400 cursor-pointer hover:text-neutral-200 transition-colors select-none list-none flex items-center justify-between">
            <span>All Intentional Issues ({generatedIssues.length})</span>
            <svg className="w-4 h-4 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </summary>
          <div className="px-4 pb-4 border-t border-white/10 pt-3 flex flex-col gap-2">
            {generatedIssues.map((issue, i) => (
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
      )}

      {/* CTA */}
      <Link
        href="/dashboard/train"
        className="inline-block bg-[#ccff00] hover:bg-[#b9eb00] text-black px-6 py-3.5 text-sm font-black uppercase italic tracking-tight -skew-x-6 transition-all"
      >
        <span className="inline-block skew-x-6">Back to training →</span>
      </Link>
    </div>
  )
}
