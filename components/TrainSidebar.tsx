'use client'

import { useState } from 'react'
import Link from 'next/link'
import { SessionSetupPanel, domainLabel } from './SessionSetupPanel'
import { RankBadge } from './RankBadge'
import { getRankProgress } from '@/lib/ranks'
import type { AppPhase, Domain, Language } from '@/types'

const STEPS: { key: AppPhase; label: string; short: string }[] = [
  { key: 'generating', label: 'Generate code',    short: 'Gen' },
  { key: 'reviewing',  label: 'Annotate & review', short: 'Rev' },
  { key: 'evaluating', label: 'Evaluating',        short: 'Eval' },
  { key: 'feedback',   label: 'See results',       short: 'Done' },
]

const ORDER: AppPhase[] = ['generating', 'reviewing', 'evaluating', 'feedback']

function stepState(key: AppPhase, phase: AppPhase) {
  const i = ORDER.indexOf(key)
  const cur = ORDER.indexOf(phase)
  if (cur < 0) return 'todo' as const
  if (i < cur) return 'done' as const
  if (i === cur) return 'active' as const
  return 'todo' as const
}

/** Connect-the-dots progress rail. One line, four dots, filled as you advance. */
function ProgressTrail({ phase, compact }: { phase: AppPhase; compact?: boolean }) {
  const cur = Math.max(0, ORDER.indexOf(phase))
  // Fill the line up to the active dot.
  const fill = ORDER.indexOf(phase) < 0 ? 0 : cur / (STEPS.length - 1)

  return (
    <div className={`relative ${compact ? 'py-1' : ''}`}>
      {/* Track + fill, centred behind the dots */}
      <div
        className={`absolute w-[3px] bg-ink/15 rounded-full ${compact ? 'left-1/2 -translate-x-1/2' : 'left-[5.5px]'}`}
        style={{ top: 7, bottom: 7 }}
      />
      <div
        className={`absolute w-[3px] bg-brand rounded-full transition-all duration-500 ${
          compact ? 'left-1/2 -translate-x-1/2' : 'left-[5.5px]'
        }`}
        style={{ top: 7, height: `calc((100% - 14px) * ${fill})` }}
      />

      <div className={`relative flex flex-col ${compact ? 'gap-3 items-center' : 'gap-2.5'}`}>
        {STEPS.map(({ key, label, short }) => {
          const state = stepState(key, phase)
          const dot =
            state === 'active'
              ? 'bg-brand ring-4 ring-brand/20'
              : state === 'done'
                ? 'bg-ink'
                : 'bg-cream'
          return (
            <div
              key={key}
              className={compact ? '' : 'flex items-center gap-2.5'}
              title={compact ? label : undefined}
            >
              <span className={`block w-3.5 h-3.5 rounded-full border-2.5 border-ink shrink-0 ${dot}`} />
              {!compact && (
                <span
                  className={`text-[13px] font-bold leading-none ${
                    state === 'active' ? 'text-brand' : state === 'done' ? 'text-ink-2' : 'text-ink-3'
                  }`}
                >
                  {label}
                </span>
              )}
              {compact && <span className="sr-only">{short}</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * The locked-in challenge: language, domain and the custom brief (truncated).
 * Read-only by design — the code was already generated and paid for, so the
 * parameters can't be swapped mid-session.
 */
function ChallengeSummary({
  language,
  domain,
  context,
}: {
  language: Language
  domain: Domain
  context?: string
}) {
  const [open, setOpen] = useState(false)
  const notes = context?.trim()

  return (
    <div className="card-pop !shadow-hard-sm p-3">
      <p className="font-display font-bold text-[12px] uppercase tracking-[0.08em] text-ink-3 mb-2">
        Challenge
      </p>

      <div className="flex flex-wrap gap-1.5">
        <span className="inline-flex items-center px-2 py-1 rounded-md border-2 border-ink bg-brand-soft font-mono font-bold text-[11px]">
          {language}
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded-md border-2 border-ink bg-cream-2 font-mono font-bold text-[11px]">
          {domainLabel(domain)}
        </span>
      </div>

      {notes && (
        <div className="mt-2 pt-2 border-t-2 border-cream-2">
          {/* Expanded notes scroll inside the card so the sidebar itself never does. */}
          <p
            className={`text-[12px] text-ink-2 leading-snug ${
              open ? 'max-h-32 overflow-y-auto pr-1' : 'line-clamp-2'
            }`}
          >
            {notes}
          </p>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="mt-1 text-[11px] font-display font-bold text-brand hover:underline"
          >
            {open ? 'Show less' : 'Show more'}
          </button>
        </div>
      )}
    </div>
  )
}

interface Props {
  collapsed: boolean
  onToggleCollapsed: () => void
  phase: AppPhase
  honor: number
  reviews: number
  credits: number
  generating: boolean
  language: Language
  domain: Domain
  context?: string
  onGenerate: (language: Language, domain: Domain, context?: string) => void
  onNewSession: () => void
}

export function TrainSidebar({
  collapsed,
  onToggleCollapsed,
  phase,
  honor,
  reviews,
  credits,
  generating,
  language,
  domain,
  context,
  onGenerate,
  onNewSession,
}: Props) {
  const { rank, next, progress, honorToNext } = getRankProgress(honor)
  const inSession = phase !== 'setup'

  if (collapsed) {
    return (
      <aside className="w-16 shrink-0 border-r-2.5 border-ink bg-cream-2/60 flex flex-col items-center gap-4 py-4 px-2">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-label="Expand sidebar"
          title="Expand sidebar"
          className="w-9 h-9 grid place-items-center rounded-[9px] border-2.5 border-ink bg-paper shadow-hard-sm hover:-translate-x-px hover:-translate-y-px active:translate-x-[3px] active:translate-y-[3px] active:shadow-none transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <span
          title={`${rank.title} · ${honor} honor`}
          className="w-9 h-9 grid place-items-center rounded-full border-2.5 border-ink bg-paper shadow-hard-sm font-display font-bold text-[10px]"
          style={{ color: rank.color }}
        >
          {rank.label.split(' ')[0]}
          <span className="sr-only">{rank.title}</span>
        </span>

        {inSession && <ProgressTrail phase={phase} compact />}

        <div className="mt-auto flex flex-col items-center gap-2">
          {inSession && (
            <button
              type="button"
              onClick={onNewSession}
              aria-label="Start a new review"
              title="Start a new review"
              className="w-9 h-9 grid place-items-center rounded-[9px] border-2.5 border-ink bg-paper text-base hover:bg-cream-2 transition-colors"
            >
              ⚔️
            </button>
          )}
          <Link
            href="/dashboard/history"
            aria-label="Review history"
            title="Review history"
            className="w-9 h-9 grid place-items-center rounded-[9px] border-2.5 border-ink bg-paper text-base hover:bg-cream-2 transition-colors"
          >
            🕐
          </Link>
        </div>
      </aside>
    )
  }

  return (
    <aside className="w-80 shrink-0 border-r-2.5 border-ink bg-cream-2/60 p-4 flex flex-col gap-4 overflow-y-auto">
      {/* Rank */}
      <div className="card-pop p-3">
        <div className="flex items-center gap-2.5">
          <RankBadge rank={rank} size="md" />
          <div className="min-w-0 flex-1">
            <p className="font-display font-extrabold text-[13px] truncate leading-none">{rank.title}</p>
            <p className="text-[11px] text-ink-2 mt-1">
              <span className="text-brand font-bold">{honor}</span> honor · {reviews} review
              {reviews !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            className="w-7 h-7 shrink-0 grid place-items-center rounded-md border-2 border-ink/15 text-ink-2 hover:border-ink hover:text-ink transition-colors"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
        {next && (
          <div className="mt-2.5">
            <div className="w-full h-2 bg-cream-2 border-2 border-ink rounded-full overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-700"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-ink-2 mt-1.5">
              {honorToNext} honor to{' '}
              <span style={{ color: next.color }} className="font-bold">{next.label}</span>
            </p>
          </div>
        )}
      </div>

      {inSession ? (
        <ChallengeSummary language={language} domain={domain} context={context} />
      ) : (
        <div>
          <h2 className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2 mb-2.5">
            Session setup
          </h2>
          <SessionSetupPanel onGenerate={onGenerate} loading={generating} credits={credits} />
        </div>
      )}

      {inSession && (
        <div>
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2 mb-2.5">
            Progress
          </p>
          <ProgressTrail phase={phase} />
        </div>
      )}

      <div className="mt-auto pt-3 border-t-2 border-ink/10 flex flex-col gap-2.5">
        {inSession && (
          <button
            type="button"
            onClick={onNewSession}
            title="This session stays saved — you can resume it later"
            className="flex items-center gap-2 text-[13px] font-bold text-ink-2 hover:text-brand transition-colors text-left"
          >
            ⚔️ Start a new review
          </button>
        )}
        <Link
          href="/dashboard/history"
          className="flex items-center gap-2 text-[13px] font-bold text-ink-2 hover:text-brand transition-colors"
        >
          🕐 View review history
        </Link>
      </div>
    </aside>
  )
}
