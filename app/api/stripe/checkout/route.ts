import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!)
}

const CREDIT_PACKS = {
  starter:  { priceId: process.env.STRIPE_PRICE_STARTER!,  credits: 10  },
  standard: { priceId: process.env.STRIPE_PRICE_STANDARD!, credits: 50  },
  pro:      { priceId: process.env.STRIPE_PRICE_PRO!,      credits: 150 },
} as const

type PackName = keyof typeof CREDIT_PACKS

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { pack } = await request.json() as { pack: PackName }

  if (!CREDIT_PACKS[pack]) {
    return NextResponse.json({ error: 'Invalid pack' }, { status: 400 })
  }

  const { priceId, credits } = CREDIT_PACKS[pack]
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const stripe = getStripe()

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/billing?success=true`,
    cancel_url: `${appUrl}/billing?canceled=true`,
    // Prefill the email (and guarantee we have it for the receipt) + add reassuring
    // copy and a clear statement description on the Checkout screen.
    customer_email: user.email,
    submit_type: 'pay',
    custom_text: {
      submit: { message: 'Credits are added to your account instantly after payment.' },
    },
    payment_intent_data: {
      description: `${credits} Code Review Wars credits — ${pack} pack`,
    },
    metadata: {
      userId: user.id,
      credits: credits.toString(),
      pack,
    },
  })

  return NextResponse.json({ url: session.url })
}
