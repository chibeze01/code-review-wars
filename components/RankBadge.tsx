import type { Rank } from '@/lib/ranks'

const SIZES = {
  sm: { badge: 'h-6 px-2 text-[11px] gap-1.5', diamond: 'w-1.5 h-1.5' },
  md: { badge: 'h-8 px-2.5 text-xs gap-2', diamond: 'w-2 h-2' },
  lg: { badge: 'h-10 px-3.5 text-sm gap-2', diamond: 'w-2.5 h-2.5' },
} as const

interface Props {
  rank: Rank
  size?: keyof typeof SIZES
}

export function RankBadge({ rank, size = 'md' }: Props) {
  const s = SIZES[size]
  return (
    <span
      className={`inline-flex items-center font-display font-bold rounded-full bg-paper border-2.5 border-ink shadow-hard-sm whitespace-nowrap ${s.badge}`}
      style={{ color: rank.color }}
    >
      <span className={`inline-block rotate-45 shrink-0 ${s.diamond}`} style={{ backgroundColor: rank.color }} />
      {rank.label}
    </span>
  )
}
