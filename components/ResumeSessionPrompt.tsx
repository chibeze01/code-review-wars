'use client'

import { domainLabel } from './SessionSetupPanel'
import type { InProgressSession } from '@/types'

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (!Number.isFinite(mins) || mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  const days = Math.round(hours / 24)
  return `${days} day${days !== 1 ? 's' : ''} ago`
}

function SessionCard({
  session,
  onResume,
}: {
  session: InProgressSession
  onResume: () => void
}) {
  const lines = session.code.split('\n').length
  const annotations = session.annotations.length
  const hasNotes = session.generalNotes.trim().length > 0
  const brief = session.context?.trim() || session.scenario.trim()

  return (
    <div className="card-pop !shadow-hard-sm p-4 text-left flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center px-2.5 py-1 rounded-md border-2 border-ink bg-brand-soft font-mono font-bold text-xs">
          {session.language}
        </span>
        <span className="inline-flex items-center px-2.5 py-1 rounded-md border-2 border-ink bg-cream-2 font-mono font-bold text-xs">
          {domainLabel(session.domain)}
        </span>
        <span className="ml-auto text-xs text-ink-3 font-semibold">
          started {timeAgo(session.createdAt)}
        </span>
      </div>

      {brief && <p className="text-sm text-ink-2 leading-snug line-clamp-2">{brief}</p>}

      <div className="flex items-center gap-4">
        <p className="text-xs text-ink-3 font-semibold">
          <span className="font-display font-extrabold text-sm text-ink">{lines}</span> lines
        </p>
        <p className="text-xs text-ink-3 font-semibold">
          <span className="font-display font-extrabold text-sm text-ink">{annotations}</span>{' '}
          annotation{annotations !== 1 ? 's' : ''}
        </p>
        {hasNotes && <p className="text-xs text-ink-3 font-semibold">+ general notes</p>}

        <button type="button" onClick={onResume} className="btn-pop btn-pop-sm btn-pop-green ml-auto">
          Resume →
        </button>
      </div>
    </div>
  )
}

interface Props {
  sessions: InProgressSession[]
  onResume: (session: InProgressSession) => void
  onStartNew: () => void
}

export function ResumeSessionPrompt({ sessions, onResume, onStartNew }: Props) {
  const many = sessions.length > 1

  return (
    <div className="flex flex-col items-center justify-center min-h-full gap-5 text-center py-4">
      <div className="tag-pop">
        ⏸️ {sessions.length} session{many ? 's' : ''} in progress
      </div>
      <h2 className="font-display font-extrabold leading-[1.04] text-3xl md:text-4xl">
        {many ? (
          <>Pick one <span className="mark-hi">to finish?</span></>
        ) : (
          <>Pick up <span className="mark-hi">where you left off?</span></>
        )}
      </h2>

      <div className="flex flex-col gap-3 max-w-xl w-full">
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} onResume={() => onResume(s)} />
        ))}
      </div>

      <button type="button" onClick={onStartNew} className="btn-pop">
        Start a new session
      </button>

      <p className="text-xs text-ink-3 max-w-sm leading-relaxed">
        Starting a new one leaves {many ? 'these sessions' : 'this session'} untouched —{' '}
        {many ? 'they stay' : 'it stays'} in your history and you can resume{' '}
        {many ? 'them' : 'it'} any time.
      </p>
    </div>
  )
}
