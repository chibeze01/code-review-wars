import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { CodeComment } from '@/types'

export const dynamic = 'force-dynamic'

// Debounced autosave of in-progress review work so a page reload (or resuming
// from history) restores the user's annotations and notes. Only ever touches a
// row that belongs to the caller and is still in_progress.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { annotations, generalNotes } = await request.json() as {
    annotations?: CodeComment[]
    generalNotes?: string
  }

  const { error } = await supabase
    .from('review_sessions')
    .update({
      annotations: annotations ?? [],
      general_notes: generalNotes ?? null,
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'in_progress')

  if (error) {
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
