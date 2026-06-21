import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

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

    const { error } = await supabase.rpc('add_credits_for_payment', {
      p_user_id: userId,
      p_amount: creditsToAdd,
      p_payment_id: paymentId,
      p_description: `Purchased ${creditsToAdd} credits`,
    })

    // Return non-2xx so Stripe retries instead of silently dropping the credit.
    if (error) {
      return NextResponse.json({ error: 'Failed to grant credits' }, { status: 500 })
    }
  }

  return NextResponse.json({ received: true })
}
