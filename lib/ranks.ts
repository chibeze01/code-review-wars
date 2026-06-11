// Codewars-style rank ladder. Honor accrues 1:1 with review scores
// (a 72/100 review earns 72 honor); thresholds gate each rank.

export interface Rank {
  kyu: number        // 8 → 1, 0 = dan (master)
  label: string      // '8 kyu'
  title: string
  color: string      // badge border/text color
  threshold: number  // honor required to hold this rank
}

export const RANKS: Rank[] = [
  { kyu: 8, label: '8 kyu', title: 'Novice Reviewer',     color: '#e8e8e8', threshold: 0 },
  { kyu: 7, label: '7 kyu', title: 'Apprentice Reviewer', color: '#e8e8e8', threshold: 100 },
  { kyu: 6, label: '6 kyu', title: 'Capable Reviewer',    color: '#ecb613', threshold: 250 },
  { kyu: 5, label: '5 kyu', title: 'Competent Reviewer',  color: '#ecb613', threshold: 500 },
  { kyu: 4, label: '4 kyu', title: 'Skilled Reviewer',    color: '#3c7ebb', threshold: 900 },
  { kyu: 3, label: '3 kyu', title: 'Seasoned Reviewer',   color: '#3c7ebb', threshold: 1400 },
  { kyu: 2, label: '2 kyu', title: 'Expert Reviewer',     color: '#866cc7', threshold: 2000 },
  { kyu: 1, label: '1 kyu', title: 'Master Reviewer',     color: '#866cc7', threshold: 2800 },
  { kyu: 0, label: '1 dan', title: 'Review Sensei',       color: '#b1361e', threshold: 3700 },
]

export interface RankProgress {
  rank: Rank
  next: Rank | null
  progress: number     // 0–1 toward next rank
  honorToNext: number
}

export function getRankProgress(honor: number): RankProgress {
  let rank = RANKS[0]
  for (const r of RANKS) {
    if (honor >= r.threshold) rank = r
  }
  const next = RANKS[RANKS.indexOf(rank) + 1] ?? null
  const progress = next
    ? (honor - rank.threshold) / (next.threshold - rank.threshold)
    : 1
  return {
    rank,
    next,
    progress: Math.min(1, Math.max(0, progress)),
    honorToNext: next ? next.threshold - honor : 0,
  }
}
