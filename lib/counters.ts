import { createAdminClient } from '@/lib/supabase/admin'
import { USAGE_COUNTER_THRESHOLD } from '@/lib/site'

export interface PublicCounters {
  reviewsGraded: number
  bugsCaught: number
  plantedFlaws: number
}

// null means "unavailable" (env not set, migration 009 not applied, DB down).
// Callers hide the counters rather than render a fake zero.
export async function getPublicCounters(): Promise<PublicCounters | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null
  try {
    const { data, error } = await createAdminClient().rpc('public_counters').single()
    if (error || !data) return null
    const row = data as { reviews_graded: number; bugs_caught: number; planted_flaws: number }
    return {
      reviewsGraded: Number(row.reviews_graded),
      bugsCaught: Number(row.bugs_caught),
      plantedFlaws: Number(row.planted_flaws),
    }
  } catch {
    return null
  }
}

export function showCounter(n: number | undefined): n is number {
  return typeof n === 'number' && n >= USAGE_COUNTER_THRESHOLD
}
