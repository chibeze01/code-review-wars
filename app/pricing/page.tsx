import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteNav, SiteFooter } from '@/components/SiteChrome'
import { SITE, PRODUCT_FACTS, formatDate } from '@/lib/site'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'One-time credit packs for Code Review Wars. 3 free sessions on signup, no card. Credits never expire, no subscription.',
}

// Real Stripe packs — keep in sync with /api/stripe/checkout and the landing page
const PACKS = [
  { name: 'Starter',  credits: 10,  price: '$5',  per: '$0.50 / review', popular: false },
  { name: 'Standard', credits: 50,  price: '$18', per: '$0.36 / review', popular: true  },
  { name: 'Pro',      credits: 150, price: '$45', per: '$0.30 / review', popular: false },
]

export default function PricingPage() {
  const { freeCredits, bugsPerChallenge } = PRODUCT_FACTS

  return (
    <div className="min-h-screen bg-cream text-ink">
      <SiteNav />

      <div className="max-w-3xl mx-auto px-[22px] py-20 text-center">
        <div className="font-display font-bold text-sm text-brand uppercase tracking-[0.08em]">pricing</div>
        <h1 className="font-display font-extrabold leading-[1.04] text-[clamp(30px,4.6vw,46px)] mt-3 mb-4">
          Pay once. <span className="mark-hi mark-green">Train forever.</span>
        </h1>
        <p className="text-ink-2 mb-2">1 credit = 1 full practice session (code generation + AI evaluation)</p>
        <p className="text-sm text-brand font-bold mb-12">
          Every new account gets {freeCredits} free credits — no credit card required
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6 items-start text-left">
          {PACKS.map(({ name, credits, price, per, popular }) => (
            <div
              key={name}
              className={`relative p-7 bg-paper border-2.5 rounded-pop-lg ${
                popular ? 'border-brand shadow-hard-lg -translate-y-1.5' : 'border-ink shadow-hard'
              }`}
            >
              {popular && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white font-display font-extrabold text-xs px-4 py-1.5 border-2.5 border-ink rounded-full shadow-hard-sm whitespace-nowrap">
                  🔥 MOST POPULAR
                </span>
              )}
              <h3 className="font-display font-extrabold text-[22px]">{name}</h3>
              <div className="flex items-baseline gap-2 mt-3.5 mb-1">
                <span className="font-display font-extrabold text-[46px]">{price}</span>
              </div>
              <div className="font-bold text-brand text-[15px]">{credits} credits</div>
              <p className="text-xs text-ink-3 mt-0.5">{per}</p>
              <p className="text-xs text-ink-3 mt-1">Launch price until {formatDate(SITE.launchPriceEnds)}</p>
              <Link href="/signup" className={`btn-pop w-full mt-5 ${popular ? 'btn-pop-green' : ''}`}>
                Get started →
              </Link>
            </div>
          ))}
        </div>

        <p className="text-[13.5px] text-ink-2 mb-16 max-w-[520px] mx-auto">
          Credits never expire. Purchased credits are non-refundable — that&apos;s what the free credits are
          for. Details in the{' '}
          <Link href="/terms" className="underline decoration-2 underline-offset-[3px] hover:text-ink">Terms</Link>.
        </p>

        <div className="card-pop p-6 text-left">
          <h3 className="font-display font-extrabold text-base mb-3">What&apos;s included in every session</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {[
              '60–120 line production-style code snippet',
              `${bugsPerChallenge.min}–${bugsPerChallenge.max} hidden bugs, security issues, and performance problems`,
              'Inline annotation editor (click any line)',
              'AI evaluation with score A–F and 0–100 points',
              'Issues found / missed breakdown',
              'Coaching feedback + ideal expert review',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-ink-2">
                <span className="text-brand font-extrabold shrink-0">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
