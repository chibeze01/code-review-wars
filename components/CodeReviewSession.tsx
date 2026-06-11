'use client'

import { useState, useRef } from 'react'
import { AnnotatedCodeEditor } from './AnnotatedCodeEditor'
import type { GeneratedCode, CodeComment } from '@/types'

const ISSUE_TIPS = [
  'Bugs — off-by-ones, wrong operators, bad conditions',
  'Security — injection, missing auth, exposed secrets',
  'Performance — N+1 queries, unnecessary loops, no caching',
  'Error handling — uncaught exceptions, swallowed errors',
  'Code quality — naming, duplication, SRP violations',
]

interface Props {
  generated: GeneratedCode
  onSubmit: (comments: CodeComment[], generalNotes: string) => void
  loading: boolean
}

export function CodeReviewSession({ generated, onSubmit, loading }: Props) {
  const commentsRef = useRef<CodeComment[]>([])
  const [commentCount, setCommentCount] = useState(0)
  const [generalNotes, setGeneralNotes] = useState('')

  function handleCommentsChange(comments: CodeComment[]) {
    commentsRef.current = comments
    setCommentCount(comments.length)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(commentsRef.current, generalNotes.trim())
  }

  const hasContent = commentCount > 0 || generalNotes.trim().length > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg px-4 py-3 flex items-start gap-3">
        <span className="mt-0.5 text-violet-400 shrink-0">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </span>
        <div>
          <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider mb-0.5">Scenario</p>
          <p className="text-sm text-slate-300">{generated.scenario}</p>
        </div>
      </div>

      <div className="bg-[#1c2128] border border-[#30363d] rounded-lg px-4 py-2.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">What to look for</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {ISSUE_TIPS.map((t) => (
            <li key={t} className="text-xs text-slate-600 flex gap-1.5">
              <span className="text-slate-700">•</span>{t}
            </li>
          ))}
        </ul>
      </div>

      <AnnotatedCodeEditor
        code={generated.code}
        language={generated.language}
        onCommentsChange={handleCommentsChange}
      />

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-slate-300">
          General Review Notes
          <span className="ml-2 text-xs font-normal text-slate-600">
            (optional — for overall impressions not tied to a specific line)
          </span>
        </label>
        <textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="e.g. 'Overall the error handling is weak, the auth layer has several gaps…'"
          rows={4}
          className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !hasContent}
        className="py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Evaluating your review…
          </span>
        ) : (
          `Submit Review${
            commentCount > 0
              ? ` · ${commentCount} inline comment${commentCount !== 1 ? 's' : ''}${generalNotes.trim() ? ' + notes' : ''}`
              : generalNotes.trim() ? ' · general notes' : ''
          }`
        )}
      </button>
    </form>
  )
}
