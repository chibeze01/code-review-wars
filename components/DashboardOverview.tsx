'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { RankBadge } from './RankBadge'
import { getRankProgress } from '@/lib/ranks'

const VOLT = '#ccff00'
const RED = '#cf0a2c'

export interface SessionSummary {
  id: string
  scenario: string | null
  language: string | null
  score: number
  grade: string
  createdAt: string
  issueResults: { type: string; severity: string; found: boolean }[] | null
  durationSeconds: number | null
}

interface Props {
  email: string
  credits: number
  sessions: SessionSummary[]
}

const CATEGORIES = ['security', 'bug', 'logic', 'performance', 'error-handling', 'style'] as const

const GRADE_COLORS: Record<string, string> = {
  A: VOLT,
  B: '#8fb33c',
  C: '#8a8a8a',
  D: '#b46a2a',
  F: RED,
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

    return { honor, avgScore, bestScore, byDay, currentStreak, longestStreak, cat, sessionsWithResults, grades, avgDuration }
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

  function cellColor(count: number, isFuture: boolean): string {
    if (isFuture) return 'transparent'
    if (count === 0) return 'rgba(255,255,255,0.07)'
    if (count === 1) return '#3f4d00'
    if (count === 2) return '#7a9400'
    if (count === 3) return '#a8c800'
    return VOLT
  }

  const recent = sessions.slice(0, 5)
  const maxGrade = Math.max(1, ...Object.values(stats.grades))

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      {/* ── Header row: greeting + rank card ── */}
      <div className="grid lg:grid-cols-[1fr_360px] gap-6 mb-8">
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-3 mb-4">
            <span className="h-px w-10" style={{ background: VOLT }} />
            <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: VOLT }}>
              The dojo
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-3">
            Welcome back<span style={{ color: VOLT }}>.</span>
          </h1>
          <p className="text-sm text-neutral-500">{email}</p>
          <div className="mt-6 flex items-center gap-4 flex-wrap">
            <Link
              href="/dashboard/train"
              className="inline-block bg-[#ccff00] hover:bg-[#b9eb00] text-black px-7 py-3.5 font-black uppercase italic tracking-tight -skew-x-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_36px_-10px_#ccff00aa]"
            >
              <span className="inline-block skew-x-6">Start training →</span>
            </Link>
            {credits === 0 && (
              <Link href="/billing" className="text-xs font-bold uppercase tracking-wider hover:underline" style={{ color: RED }}>
                Out of credits — refuel →
              </Link>
            )}
          </div>
        </div>

        <div className="border border-white/10 bg-[#101010] p-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-4">Your rank</p>
          <div className="flex items-center gap-4 mb-5">
            <RankBadge rank={rank} size="lg" />
            <div>
              <p className="text-base font-black uppercase italic tracking-tight">{rank.title}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                <span className="font-bold" style={{ color: VOLT }}>{stats.honor}</span> honor
              </p>
            </div>
          </div>
          {next ? (
            <>
              <div className="h-2 bg-white/10 overflow-hidden mb-2">
                <div
                  className="h-full transition-all duration-700"
                  style={{ width: `${Math.round(progress * 100)}%`, background: `linear-gradient(90deg, ${VOLT}, ${next.color})` }}
                />
              </div>
              <p className="text-[11px] text-neutral-600">
                {honorToNext} honor to <span style={{ color: next.color }} className="font-bold">{next.label} — {next.title}</span>
              </p>
            </>
          ) : (
            <p className="text-[11px]" style={{ color: RED }}>Highest rank achieved. You are the sensei now.</p>
          )}
        </div>
      </div>

      {/* ── Stat band ── */}
      <div className="grid grid-cols-2 md:grid-cols-6 border border-white/10 divide-x divide-white/10 mb-8">
        {[
          { k: String(sessions.length), v: 'reviews' },
          { k: String(stats.avgScore), v: 'avg score' },
          { k: String(stats.bestScore), v: 'best score' },
          { k: String(stats.currentStreak), v: 'day streak' },
          { k: String(stats.longestStreak), v: 'longest streak' },
          { k: stats.avgDuration ? formatDuration(stats.avgDuration) : '—', v: 'avg review time' },
        ].map((s) => (
          <div key={s.v} className="p-4 text-center max-md:border-b max-md:border-white/10">
            <p className="text-2xl font-black italic" style={{ color: VOLT }}>{s.k}</p>
            <p className="text-[10px] uppercase tracking-widest text-neutral-500 mt-1.5">{s.v}</p>
          </div>
        ))}
      </div>

      {/* ── Contribution graph ── */}
      <div className="border border-white/10 bg-[#101010] p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-black uppercase italic tracking-tight">Training activity</h2>
          <div className="flex items-center gap-1.5 text-[10px] text-neutral-600">
            less
            {[0, 1, 2, 3, 4].map((n) => (
              <span key={n} className="w-2.5 h-2.5 inline-block" style={{ background: cellColor(n, false) }} />
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
                  <span key={w} className="w-[11px] text-[9px] text-neutral-600 overflow-visible whitespace-nowrap">
                    {label?.label ?? ''}
                  </span>
                )
              })}
            </div>
            <div className="flex gap-[3px]">
              <div className="flex flex-col gap-[3px] w-7 mr-1">
                {['', 'Mon', '', 'Wed', '', 'Fri', ''].map((d, i) => (
                  <span key={i} className="h-[11px] text-[9px] text-neutral-600 leading-[11px]">{d}</span>
                ))}
              </div>
              {grid.weeks.map((col, w) => (
                <div key={w} className="flex flex-col gap-[3px]">
                  {col.map((cell, d) => (
                    <span
                      key={d}
                      title={cell.date ? `${cell.count} review${cell.count !== 1 ? 's' : ''} · ${cell.date.toDateString()}` : undefined}
                      className="w-[11px] h-[11px] inline-block"
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
        <div className="border border-white/10 bg-[#101010] p-6">
          <h2 className="text-sm font-black uppercase italic tracking-tight mb-1">Bug-hunting skills</h2>
          <p className="text-[11px] text-neutral-600 mb-5">Catch rate by issue category</p>
          {stats.sessionsWithResults === 0 ? (
            <div className="border border-dashed border-white/15 p-6 text-center">
              <p className="text-xs text-neutral-500 leading-relaxed">
                No category data yet — finish a training session and your
                per-category performance shows up here.
              </p>
              <Link href="/dashboard/train" className="inline-block mt-3 text-xs font-black uppercase italic" style={{ color: VOLT }}>
                Train now →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {CATEGORIES.map((c) => {
                const { found, total } = stats.cat[c]
                const pct = total > 0 ? Math.round((found / total) * 100) : null
                return (
                  <div key={c}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-300">{categoryLabel(c)}</span>
                      <span className="text-[11px] font-mono text-neutral-500">
                        {total > 0 ? `${found}/${total} · ${pct}%` : 'no data'}
                      </span>
                    </div>
                    <div className="h-2 bg-white/5 overflow-hidden flex">
                      {total > 0 && (
                        <>
                          <div className="h-full transition-all duration-700" style={{ width: `${pct}%`, background: VOLT }} />
                          <div className="h-full transition-all duration-700" style={{ width: `${100 - (pct ?? 0)}%`, background: `${RED}55` }} />
                        </>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Grade distribution */}
        <div className="border border-white/10 bg-[#101010] p-6">
          <h2 className="text-sm font-black uppercase italic tracking-tight mb-1">Grade distribution</h2>
          <p className="text-[11px] text-neutral-600 mb-5">Across all {sessions.length} review{sessions.length !== 1 ? 's' : ''}</p>
          <div className="flex items-end justify-around gap-4 h-44 pt-2">
            {(['A', 'B', 'C', 'D', 'F'] as const).map((g) => {
              const count = stats.grades[g]
              const h = count > 0 ? Math.max(10, (count / maxGrade) * 130) : 3
              return (
                <div key={g} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-xs font-mono text-neutral-500">{count}</span>
                  <div
                    className="w-full max-w-[48px] transition-all duration-700"
                    style={{ height: `${h}px`, background: count > 0 ? GRADE_COLORS[g] : 'rgba(255,255,255,0.08)' }}
                  />
                  <span className="text-sm font-black italic" style={{ color: GRADE_COLORS[g] }}>{g}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Recent sessions ── */}
      <div className="border border-white/10 bg-[#101010] p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-black uppercase italic tracking-tight">Recent sessions</h2>
          <Link href="/dashboard/history" className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 hover:text-white transition-colors">
            Full history →
          </Link>
        </div>
        {recent.length === 0 ? (
          <div className="border border-dashed border-white/15 p-10 text-center">
            <p className="text-sm text-neutral-500 mb-4">No reviews yet. The dojo is waiting.</p>
            <Link
              href="/dashboard/train"
              className="inline-block bg-[#ccff00] hover:bg-[#b9eb00] text-black px-6 py-3 font-black uppercase italic tracking-tight -skew-x-6 transition-all"
            >
              <span className="inline-block skew-x-6">First session →</span>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recent.map((s) => (
              <div key={s.id} className="py-3 flex items-center gap-4">
                <span
                  className="w-9 h-9 border-2 bg-[#0a0a0a] flex items-center justify-center text-sm font-black shrink-0"
                  style={{ borderColor: GRADE_COLORS[s.grade] ?? '#555', color: GRADE_COLORS[s.grade] ?? '#999' }}
                >
                  {s.grade}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-neutral-200 truncate">{s.scenario ?? 'Code review session'}</p>
                  <p className="text-[11px] text-neutral-600 mt-0.5">
                    {s.language} · {new Date(s.createdAt).toLocaleDateString()}
                    {s.durationSeconds ? ` · ${formatDuration(s.durationSeconds)}` : ''}
                  </p>
                </div>
                <span className="text-xs font-black italic shrink-0" style={{ color: VOLT }}>
                  +{s.score} honor
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
