import { LANGUAGES } from '@/lib/languages'
import { RANKS } from '@/lib/ranks'

// Launch-facing facts. Every number on a public page traces to a constant here
// or to a live query (lib/counters.ts) — never a literal in markup.
export const SITE = {
  name: 'Code Review Wars',
  url: 'https://codereviewwars.dev',
  contactEmail: 'support@codereviewwars.dev',
  founderFirstName: 'Chibeze',
  launchMonth: 'September 2026',
  // TODO(launch): UK distance-selling identity — legal trading name + address.
  tradingName: 'Chibeze (sole trader)',
  tradingAddress: 'Trading address — add before launch',
  llmProvider: { name: 'Anthropic', privacyUrl: 'https://www.anthropic.com/privacy' },
  // Replaces the old strike-through "was" prices. This date is a promise: prices
  // must actually go up after it. TODO(launch): confirm the date.
  launchPriceEnds: '2026-10-31',
  // Bump whenever /sources, /privacy or /terms change.
  lastReviewed: '2026-09-13',
} as const

export const PRODUCT_FACTS = {
  languages: LANGUAGES.length,
  // Six built-in domains (DOMAINS in components/SessionSetupPanel) plus custom.
  domains: 7,
  // Generator prompt asks for "exactly 4–6 intentional issues".
  bugsPerChallenge: { min: 4, max: 6 },
  ranks: RANKS.length,
  // Migration 008.
  freeCredits: 3,
} as const

// Usage counters (reviews graded, bugs caught, bank size) stay hidden below
// this. A small or zero number is never rendered as social proof.
export const USAGE_COUNTER_THRESHOLD = 100

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// "2026-10-31" → "31 October 2026", timezone-independent.
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}
