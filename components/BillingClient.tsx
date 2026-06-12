'use client'

import { useState } from 'react'

// Real Stripe packs — keep in sync with /api/stripe/checkout and the landing page
const CREDIT_PACKS = [
  {
    pack: 'starter',
    name: 'Starter',
    credits: 10,
    price: '$5',
    was: '$10',
    pricePerCredit: '$0.50 / review',
    popular: false,
  },
  {
    pack: 'standard',
    name: 'Standard',
    credits: 50,
    price: '$18',
    was: '$36',
    pricePerCredit: '$0.36 / review',
    popular: true,
  },
  {
    pack: 'pro',
    name: 'Pro',
    credits: 150,
    price: '$45',
    was: '$90',
    pricePerCredit: '$0.30 / review',
    popular: false,
  },
] as const

interface Transaction {
  id: string
  amount: number
  type: string
  description: string | null
  created_at: string
}

interface Props {
  credits: number
  transactions: Transaction[]
  success: boolean
  canceled: boolean
}

export function BillingClient({ credits, transactions, success, canceled }: Props) {
  const [loading, setLoading] = useState<string | null>(null)
  const [buyError, setBuyError] = useState<string | null>(null)

  async function handleBuy(pack: string) {
    setLoading(pack)
    setBuyError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      if (url) window.location.href = url
    } catch (e) {
      setBuyError(e instanceof Error ? e.message : 'Failed to start checkout')
      setLoading(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-[22px] py-10">
      <div className="font-display font-bold text-sm text-brand uppercase tracking-[0.08em] mb-3">
        top up
      </div>
      <h1 className="font-display font-extrabold leading-[1.04] text-4xl mb-8">
        Buy <span className="mark-hi mark-green">credits.</span>
      </h1>

      {success && (
        <div className="mb-8 bg-brand-soft border-2.5 border-ink rounded-pop px-4 py-3 text-sm font-bold shadow-hard-sm">
          🎉 Payment successful — credits have been added to your account.
        </div>
      )}
      {canceled && (
        <div className="mb-8 bg-cream-2 border-2.5 border-ink rounded-pop px-4 py-3 text-sm font-medium text-ink-2 shadow-hard-sm">
          Payment canceled. No charges were made.
        </div>
      )}
      {buyError && (
        <div className="mb-8 bg-coral-soft border-2.5 border-ink rounded-pop px-4 py-3 text-sm font-bold shadow-hard-sm">
          ⚠️ {buyError}
        </div>
      )}

      {/* Balance card */}
      <div className="card-pop p-6 mb-10 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-3 mb-1">Current balance</p>
          <p className={`font-display font-extrabold text-4xl ${credits === 0 ? 'text-coral' : 'text-brand'}`}>
            {credits} <span className="text-lg text-ink-2 font-bold">credits</span>
          </p>
        </div>
        <div className="text-right text-xs text-ink-3 leading-relaxed font-medium">
          <p>1 credit = 1 full session</p>
          <p>(code generation + AI evaluation)</p>
        </div>
      </div>

      {/* Credit packs — mirrors the landing pricing cards */}
      <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-3 mb-5">Pick your pack</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-12 items-start">
        {CREDIT_PACKS.map(({ pack, name, credits: c, price, was, pricePerCredit, popular }) => (
          <div
            key={pack}
            className={`relative p-5 bg-paper border-2.5 rounded-pop-lg ${
              popular ? 'border-brand shadow-hard-lg -translate-y-1.5' : 'border-ink shadow-hard'
            }`}
          >
            {popular && (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-brand text-white font-display font-extrabold text-[11px] px-3.5 py-1 border-2.5 border-ink rounded-full shadow-hard-sm whitespace-nowrap">
                🔥 MOST POPULAR
              </span>
            )}
            <h3 className="font-display font-extrabold text-lg">{name}</h3>
            <div className="flex items-baseline gap-2 mt-2 mb-0.5">
              <span className="font-display font-extrabold text-[34px]">{price}</span>
              <span className="text-base text-ink-3 line-through font-bold">{was}</span>
            </div>
            <p className="font-bold text-brand text-sm">{c} credits</p>
            <p className="text-[11px] text-ink-3 mt-0.5">{pricePerCredit}</p>
            <button
              onClick={() => handleBuy(pack)}
              disabled={!!loading}
              className={`btn-pop btn-pop-sm w-full mt-4 ${popular ? 'btn-pop-green' : ''}`}
            >
              {loading === pack ? 'Redirecting…' : `Buy ${c} credits`}
            </button>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <>
          <p className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-3 mb-4">Transaction history</p>
          <div className="card-pop !shadow-hard-sm divide-y-2 divide-cream-2 overflow-hidden">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`text-[10px] font-display font-bold uppercase px-2 py-0.5 border-2 border-ink rounded-full shrink-0 ${
                      tx.type === 'purchase' ? 'bg-brand-soft' : tx.type === 'bonus' ? 'bg-hi-soft' : 'bg-coral-soft'
                    }`}
                  >
                    {tx.type}
                  </span>
                  <div className="min-w-0">
                    <p className="text-ink truncate font-medium">{tx.description ?? tx.type}</p>
                    <p className="text-[11px] text-ink-3 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-mono font-bold shrink-0 ml-4 ${tx.amount > 0 ? 'text-brand' : 'text-coral'}`}
                >
                  {tx.amount > 0 ? '+' : ''}{tx.amount}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
