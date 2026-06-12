'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { RankBadge } from './RankBadge'
import { getRankProgress, GRADE_COLORS } from '@/lib/ranks'

export interface SessionSummary {
  id: string
  scenario: string | null
  language: string | null
  score: number
  grade: string
  createdAt: string
  issueResults: { type: string; severity: string; found: boolean }[] | null
  durationSeconds: number | null
  // Count of "brilliant" finds — genuine flaws caught that were never planted
  brilliants: number
}

interface Props {
  email: string
  credits: number
  sessions: SessionSummary[]
}

const CATEGORIES = ['security', 'bug', 'logic', 'performance', 'error-handling', 'style'] as const

// Handoff semantic mapping: security → purple, bug → coral, perf → yellow,
// errors → blue, logic → green, style → ink-2
const CATEGORY_COLORS: Record<string, string> = {
  security: '#7c3aed',
  bug: '#ff6a3d',
  performance: '#ca8a04',
  'error-handling': '#3b82f6',
  logic: '#16a34a',
  style: '#57534e',
}

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function categoryLabel(c: string): string {
  return c === 'error-handling' ? 'Error handling' : c.charAt(0).toUpperCase() + c.slice(1)
}

export function DashboardOverview({ email, credits, sessions }: Props) {
  const stats = useMemo(() => {
    const honor = sessions.reduce((sum, s) => sum + (s.score ?? 0), 0)
    const avgScore = sessions.length ? Math.round(honor / sessions.length) : 0
    const bestScore = sessions.reduce((m, s) => Math.max(m, s.score ?? 0), 0)

    // Daily activity (for the contribution graph + streaks)
    const byDay = new Map<string, number>()
    for (const s of sessions) {
      const k = dayKey(new Date(s.createdAt))
      byDay.set(k, (byDay.get(k) ?? 0) + 1)
    }

    // Streaks
    let currentStreak = 0
    const cursor = new Date()
    if (!byDay.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1) // allow "yesterday" to keep a streak alive
    while (byDay.has(dayKey(cursor))) {
      currentStreak++
      cursor.setDate(cursor.getDate() - 1)
    }
    let longestStreak = 0
    const sortedDays = [...byDay.keys()].sort()
    let run = 0
    let prev: Date | null = null
    for (const k of sortedDays) {
      const d = new Date(k)
      run = prev && d.getTime() - prev.getTime() === 86400000 ? run + 1 : 1
      longestStreak = Math.max(longestStreak, run)
      prev = d
    }

    // Category catch rates (from structured issueResults — newer sessions only)
    const cat: Record<string, { found: number; total: number }> = {}
    for (const c of CATEGORIES) cat[c] = { found: 0, total: 0 }
    let sessionsWithResults = 0
    for (const s of sessions) {
      if (!Array.isArray(s.issueResults) || s.issueResults.length === 0) continue
      sessionsWithResults++
      for (const r of s.issueResults) {
        if (!cat[r.type]) cat[r.type] = { found: 0, total: 0 }
        cat[r.type].total++
        if (r.found) cat[r.type].found++
      }
    }

    // Grade distribution
    const grades: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 }
    for (const s of sessions) if (grades[s.grade] !== undefined) grades[s.grade]++

    // Average duration (only sessions that recorded one)
    const durations = sessions.filter((s) => s.durationSeconds && s.durationSeconds > 0)
    const avgDuration = durations.length
      ? durations.reduce((sum, s) => sum + (s.durationSeconds ?? 0), 0) / durations.length
      : null

    // Lifetime brilliant finds
    const brilliants = sessions.reduce((sum, s) => sum + (s.brilliants ?? 0), 0)

    return { honor, avgScore, bestScore, byDay, currentStreak, longestStreak, cat, sessionsWithResults, grades, avgDuration, brilliants }
  }, [sessions])

  const { rank, next, progress, honorToNext } = getRankProgress(stats.honor)

  // Contribution grid: 52 week columns, GitHub-style, ending today
  const grid = useMemo(() => {
    const today = new Date()
    const start = new Date(today)
    start.setDate(today.getDate() - today.getDay() - 51 * 7) // Sunday, 52 weeks back
    const weeks: { date: Date | null; count: number }[][] = []
    const monthLabels: { col: number; label: string }[] = []
    let lastMonth = -1
    for (let w = 0; w < 52; w++) {
      const col: { date: Date | null; count: number }[] = []
      for (let d = 0; d < 7; d++) {
        const date = new Date(start)
        date.setDate(start.getDate() + w * 7 + d)
        if (date > today) {
          col.push({ date: null, count: 0 })
        } else {
          col.push({ date, count: stats.byDay.get(dayKey(date)) ?? 0 })
        }
      }
      const firstOfCol = col[0].date
      if (firstOfCol && firstOfCol.getMonth() !== lastMonth) {
        lastMonth = firstOfCol.getMonth()
        monthLabels.push({ col: w, label: firstOfCol.toLocaleString('en', { month: 'short' }) })
      }
      weeks.push(col)
    }
    return { weeks, monthLabels }
  }, [stats.byDay])

  // Heatmap levels — tints of brand green on a light base (handoff 7b)
  function cellColor(count: number, isFuture: boolean): string {
    if (isFuture) return 'transparent'
    if (count === 0) return '#eeeae2'
    if (count === 1) return '#bbf0cd'
    if (count === 2) return '#7ddf9f'
    if (count === 3) return '#3cc06e'
    return '#16a34a'
  }

  const recent = sessions.slice(0, 5)
  const maxGrade = Math.max(1, ...Object.values(stats.grades))

  return (
    <div className="max-w-[1140px] mx-auto px-[22px] py-10">
      {/* ── Header row: greeting + rank card ── */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-8">
        <div className="flex flex-col justify-center">
          <div className="font-display font-bold text-sm text-brand uppercase tracking-[0.08em] mb-3">
            your training ground
          </div>
          <h1 className="font-display font-extrabold leading-[1.04] text-4xl md:text-5xl">
            Welcome <span className="mark-hi">back.</span>
          </h1>
          <p className="text-sm text-ink-3 mt-3">{email}</p>
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <Link href="/dashboard/train" className="btn-pop btn-pop-green">
              🎯 Start a review
            </Link>
            <Link href="/dashboard/history" className="btn-pop">
              View history
            </Link>
            {credits === 0 && (
              <Link href="/billing" className="font-bold text-sm text-coral hover:underline">
                Out of credits — top up →
              </Link>
            )}
          </div>
        </div>

        <div className="card-pop p-6">
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-3 mb-4">Your rank</p>
          <div className="flex items-center gap-4 mb-5">
            <RankBadge rank={rank} size="lg" />
            <div>
              <p className="font-display font-extrabold text-base">{rank.title}</p>
              <p className="text-xs text-ink-2 mt-0.5">
                <span className="font-bold text-brand">{stats.honor}</span> honor
              </p>
            </div>
          </div>
          {next ? (
            <>
              <div className="h-3 bg-cream-2 border-2 border-ink rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-brand transition-all duration-700"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p className="text-xs text-ink-2">
                {honorToNext} honor to <span style={{ color: next.color }} className="font-bold">{next.label} — {next.title}</span>
              </p>
            </>
          ) : (
            <p className="text-xs font-bold text-coral">Highest rank achieved. You are the sensei now. 🥋</p>
          )}
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3.5 mb-8">
        {[
          { k: String(sessions.length), v: 'reviews', emoji: '📝' },
          { k: String(stats.avgScore), v: 'avg score', emoji: '🎯' },
          { k: String(stats.bestScore), v: 'best score', emoji: '🏆' },
          { k: String(stats.currentStreak), v: 'day streak', emoji: '🔥' },
          { k: String(stats.longestStreak), v: 'longest streak', emoji: '📈' },
          { k: stats.avgDuration ? formatDuration(stats.avgDuration) : '—', v: 'avg time', emoji: '⏱️' },
        ].map((s) => (
          <div key={s.v} className="card-pop !shadow-hard-sm p-4 text-center">
            <p className="text-xs mb-1">{s.emoji}</p>
            <p className="font-display font-extrabold text-2xl">{s.k}</p>
            <p className="text-[11px] font-semibold text-ink-3 mt-1">{s.v}</p>
          </div>
        ))}
        {/* The standout: brilliant finds — flaws caught that we never planted */}
        <div
          className="bg-hi-soft border-2.5 border-ink rounded-pop-lg shadow-hard-sm p-4 text-center max-md:col-span-2"
          title="Genuine flaws you caught that the generator never intentionally planted"
        >
          <p className="text-xs mb-1">✨</p>
          <p className="font-display font-extrabold text-2xl">
            {stats.brilliants}
            <span className="font-mono text-brand-dark ml-1">!!</span>
          </p>
          <p className="text-[11px] font-bold text-ink-2 mt-1">brilliant</p>
        </div>
      </div>

      {/* ── Contribution graph ── */}
      <div className="card-pop p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-extrabold text-lg">Training activity</h2>
          <div className="flex items-center gap-1.5 text-[11px] text-ink-3 font-medium">
            less
            {[0, 1, 2, 3, 4].map((n) => (
              <span key={n} className="w-2.5 h-2.5 inline-block rounded-[3px]" style={{ background: cellColor(n, false) }} />
            ))}
            more
          </div>
        </div>
        <div className="overflow-x-auto pb-1">
          <div className="inline-block">
            <div className="flex gap-[3px] mb-1.5 ml-8">
              {grid.weeks.map((_, w) => {
                const label = grid.monthLabels.find((m) => m.col === w)
                return (
                  <span key={w} className="w-[11px] text-[9px] text-ink-3 overflow-visible whitespace-nowrap">
                    {label?.label ?? ''}
                  </span>
                )
              })}
            </div>
            <div className="flex gap-[3px]">
              <div className="flex flex-col gap-[3px] w-7 mr-1">
                {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                  <span key={i} className="h-[11px] text-[9px] text-ink-3 leading-[11px]">{d}</span>
                ))}
              </div>
              {grid.weeks.map((col, w) => (
                <div key={w} className="flex flex-col gap-[3px]">
                  {col.map((cell, d) => (
                    <span
                      key={d}
                      title={cell.date ? `${cell.count} review${cell.count !== 1 ? 's' : ''} · ${cell.date.toDateString()}` : undefined}
                      className="w-[11px] h-[11px] inline-block rounded-[3px]"
                      style={{ background: cellColor(cell.count, cell.date === null) }}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Skills + grades ── */}
      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        {/* Category catch rates */}
        <div className="card-pop p-6">
          <h2 className="font-display font-extrabold text-lg mb-1">Bug-hunting skills</h2>
          <p className="text-xs text-ink-3 mb-5">Catch rate by issue category</p>
          {stats.sessionsWithResults === 0 ? (
            <div className="border-2 border-dashed border-ink/20 rounded-pop p-6 text-center">
              <p className="text-sm text-ink-2 leading-relaxed">
                No category data yet — finish a training session and your
                per-category performance shows up here.
              </p>
              <Link href="/dashboard/train" className="inline-block mt-3 font-display font-bold text-sm text-brand hover:underline">
                Train now →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {CATEGORIES.map((c) => {
                const { found, total } = stats.cat[c]
                const pct = total > 0 ? Math.round((found / total) * 100) : null
                const color = CATEGORY_COLORS[c] ?? '#57534e'
                return (
                  <div key={c}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[13px] font-bold flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: color }} />
                        {categoryLabel(c)}
                      </span>
                      <span className="text-xs font-mono text-ink-2">
                        {total > 0 ? `${found}/${total} · ${pct}%` : 'no data'}
                      </span>
                    </div>
                    <div className="h-3 bg-cream-2 border-2 border-ink rounded-full overflow-hidden">
                      {total > 0 && (
                        <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Grade distribution */}
        <div className="card-pop p-6">
          <h2 className="font-display font-extrabold text-lg mb-1">Grade distribution</h2>
          <p className="text-xs text-ink-3 mb-5">Across all {sessions.length} review{sessions.length !== 1 ? 's' : ''}</p>
          <div className="flex items-end justify-around gap-4 h-44 pt-2">
            {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => {
              const count = stats.grades[g]
              const h = count > 0 ? Math.max(10, (count / maxGrade) * 130) : 4
              return (
                <div key={g} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-xs font-mono font-bold text-ink-2">{count}</span>
                  <div
                    className={`w-full max-w-[48px] rounded-t-md transition-all duration-700 ${count > 0 ? 'border-2 border-b-0 border-ink' : ''}`}
                    style={{ height: `${h}px`, background: count > 0 ? GRADE_COLORS[g] : '#eeeae2' }}
                  />
                  <span className="font-display font-extrabold text-sm" style={{ color: GRADE_COLORS[g] }}>{g}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Recent sessions ── */}
      <div className="card-pop p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display font-extrabold text-lg">Recent reviews</h2>
          <Link href="/dashboard/history" className="font-display font-bold text-sm text-ink-2 hover:text-ink transition-colors">
            Full history →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="border-2 border-dashed border-ink/20 rounded-pop p-10 text-center">
            <p className="text-sm text-ink-2 mb-4">No reviews yet. Your first bug is waiting. 🐛</p>
            <Link href="/dashboard/train" className="btn-pop btn-pop-green">
              First session →
            </Link>
          </div>
        ) : (
          <div className="divide-y-2 divide-cream-2">
            {recent.map((s) => (
              <Link key={s.id} href={`/dashboard/history/${s.id}`} className="py-3 flex items-center gap-4 group">
                <span
                  className="w-9 h-9 border-2.5 border-ink rounded-[10px] bg-paper flex items-center justify-center text-sm font-display font-extrabold shrink-0 shadow-hard-sm"
                  style={{ color: GRADE_COLORS[s.grade] ?? '#57534e' }}
                >
                  {s.grade}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-brand transition-colors">
                    {s.scenario ?? 'Code review session'}
                  </p>
                  <p className="text-xs text-ink-3 mt-0.5">
                    {s.language} · {new Date(s.createdAt).toLocaleDateString()}
                    {s.durationSeconds ? ` · ${formatDuration(s.durationSeconds)}` : ''}
                  </p>
                </div>
                {s.brilliants > 0 && (
                  <span
                    className="inline-flex items-center gap-1 font-mono font-bold text-[11px] bg-hi-soft border-2 border-ink rounded-full px-2 py-0.5 shrink-0"
                    title={`${s.brilliants} brilliant find${s.brilliants !== 1 ? 's' : ''}`}
                  >
                    ✨ {s.brilliants}!!
                  </span>
                )}
                <span className="font-mono font-bold text-xs text-brand shrink-0">
                  +{s.score} honor
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
