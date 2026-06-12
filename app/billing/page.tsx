import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppNav } from '@/components/AppNav'
import { BillingClient } from '@/components/BillingClient'

interface SearchParams {
  success?: string
  canceled?: string
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, transactionsResult, params] = await Promise.all([
    supabase.from('profiles').select('credits').eq('id', user.id).single(),
    supabase
      .from('credit_transactions')
      .select('id, amount, type, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20),
    searchParams,
  ])

  const credits = profileResult.data?.credits ?? 0

  return (
    <div className="min-h-screen bg-cream text-ink">
      <AppNav credits={credits} />
      <BillingClient
        credits={credits}
        transactions={transactionsResult.data ?? []}
        success={!!params.success}
        canceled={!!params.canceled}
      />
    </div>
  )
}
