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
  initialComments?: CodeComment[]
  initialNotes?: string
  // Fires on every annotation/notes change so the parent can autosave the
  // in-progress session (debounced upstream).
  onProgress?: (comments: CodeComment[], generalNotes: string) => void
}

export function CodeReviewSession({
  generated,
  onSubmit,
  loading,
  initialComments = [],
  initialNotes = '',
  onProgress,
}: Props) {
  const commentsRef = useRef<CodeComment[]>(initialComments)
  const [commentCount, setCommentCount] = useState(initialComments.length)
  const [generalNotes, setGeneralNotes] = useState(initialNotes)

  function handleCommentsChange(comments: CodeComment[]) {
    commentsRef.current = comments
    setCommentCount(comments.length)
    onProgress?.(comments, generalNotes)
  }

  function handleNotesChange(notes: string) {
    setGeneralNotes(notes)
    onProgress?.(commentsRef.current, notes)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(commentsRef.current, generalNotes.trim())
  }

  const hasContent = commentCount > 0 || generalNotes.trim().length > 0

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="card-pop !shadow-hard-sm border-l-[6px] border-l-brand px-4 py-3">
        <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-brand mb-1">🎯 The mission</p>
        <p className="text-sm text-ink-2 leading-relaxed">{generated.scenario}</p>
      </div>

      <div className="bg-hi-soft border-2.5 border-ink rounded-pop px-4 py-3">
        <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2 mb-1.5">🔍 What to look for</p>
        <ul className="flex flex-wrap gap-x-6 gap-y-1">
          {ISSUE_TIPS.map((t) => (
            <li key={t} className="text-xs text-ink-2 flex gap-1.5">
              <span className="text-ink-3">•</span>{t}
            </li>
          ))}
        </ul>
      </div>

      <AnnotatedCodeEditor
        code={generated.code}
        language={generated.language}
        initialComments={initialComments}
        onCommentsChange={handleCommentsChange}
      />

      <div className="flex flex-col gap-1.5">
        <label className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2">
          General review notes
          <span className="ml-2 font-sans font-normal normal-case tracking-normal text-ink-3">
            (optional — for overall impressions not tied to a specific line)
          </span>
        </label>
        <textarea
          value={generalNotes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="e.g. 'Overall the error handling is weak, the auth layer has several gaps…'"
          rows={4}
          className="w-full bg-paper border-2.5 border-ink rounded-pop px-4 py-3 text-sm text-ink placeholder-ink-3 focus:outline-none focus:bg-cream-2/40 resize-none transition-colors"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !hasContent}
        className="btn-pop btn-pop-green w-full"
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
          `Submit review${
            commentCount > 0
              ? ` · ${commentCount} inline comment${commentCount !== 1 ? 's' : ''}${generalNotes.trim() ? ' + notes' : ''}`
              : generalNotes.trim() ? ' · general notes' : ''
          }`
        )}
      </button>
    </form>
  )
}
