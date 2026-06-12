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
      <div className="bg-[#101010] border border-white/10 border-l-2 border-l-[#ccff00] px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#ccff00] mb-1">The mission</p>
        <p className="text-sm text-neutral-300 leading-relaxed">{generated.scenario}</p>
      </div>

      <div className="bg-[#101010] border border-white/10 px-4 py-3">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-1.5">What to look for</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {ISSUE_TIPS.map((t) => (
            <li key={t} className="text-xs text-neutral-600 flex gap-1.5">
              <span className="text-neutral-700">◆</span>{t}
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
        <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          General review notes
          <span className="ml-2 font-normal normal-case tracking-normal text-neutral-600">
            (optional — for overall impressions not tied to a specific line)
          </span>
        </label>
        <textarea
          value={generalNotes}
          onChange={(e) => setGeneralNotes(e.target.value)}
          placeholder="e.g. 'Overall the error handling is weak, the auth layer has several gaps…'"
          rows={4}
          className="w-full bg-[#0a0a0a] border border-white/15 px-4 py-3 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-[#ccff00] resize-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !hasContent}
        className="py-3.5 bg-[#ccff00] hover:bg-[#b9eb00] disabled:opacity-40 disabled:cursor-not-allowed text-black font-black uppercase italic tracking-tight text-sm -skew-x-6 transition-all"
      >
        <span className="inline-block skew-x-6">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Evaluating your review…
            </span>
          ) : (
            `Submit review${
              commentCount > 0
                ? ` · ${commentCount} inline comment${commentCount !== 1 ? 's' : ''}${generalNotes.trim() ? ' + notes' : ''}`
                : generalNotes.trim() ? ' · general notes' : ''
            }`
          )}
        </span>
      </button>
    </form>
  )
}
