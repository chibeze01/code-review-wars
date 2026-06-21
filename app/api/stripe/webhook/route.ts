import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { sendPurchaseConfirmation } from '@/lib/email/sendPurchaseConfirmation'

export const dynamic = 'force-dynamic'

const PACK_LABELS: Record<string, string> = {
  starter: 'Starter pack',
  standard: 'Standard pack',
  pro: 'Pro pack',
}

function formatAmount(amount: number | null, currency: string | null): string {
  if (amount == null) return ''
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: (currency ?? 'usd').toUpperCase(),
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${(currency ?? '').toUpperCase()}`
  }
}

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

// Use the service role key here — webhook runs outside user auth context
function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const { userId, credits } = session.metadata ?? {}

    if (!userId || !credits) {
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const creditsToAdd = parseInt(credits, 10)

    // Stable, always-present idempotency key: a retried/replayed delivery of the
    // same payment must not double-grant credits. add_credits_for_payment inserts
    // the ledger row and increments the balance atomically, skipping duplicates.
    const paymentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.id

    const { data: granted, error } = await supabase.rpc('add_credits_for_payment', {
      p_user_id: userId,
      p_amount: creditsToAdd,
      p_payment_id: paymentId,
      p_description: `Purchased ${creditsToAdd} credits`,
    })

    // Return non-2xx so Stripe retries instead of silently dropping the credit.
    if (error) {
      return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 })
    }

    // Send the confirmation only when credits were *newly* granted — a retried or
    // replayed delivery returns false, so the customer never gets a duplicate email.
    // Email is best-effort: it must not gate the 200 (credits are already applied).
    if (granted === true) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('credits, email')
          .eq('id', userId)
          .single()

        const recipient = session.customer_details?.email ?? profile?.email ?? null
        if (recipient) {
          await sendPurchaseConfirmation({
            to: recipient,
            name: session.customer_details?.name,
            packName: PACK_LABELS[session.metadata?.pack ?? ''] ?? 'Credit pack',
            credits: creditsToAdd,
            amountFormatted: formatAmount(session.amount_total, session.currency),
            newBalance: profile?.credits ?? creditsToAdd,
          })
        }
      } catch (e) {
        console.error('[webhook] post-grant email step failed:', e)
      }
    }
  }

  return NextResponse.json({ received: true })
}
