'use client'

import { useState } from 'react'

const VOLT = '#ccff00'
const RED = '#cf0a2c'

const CREDIT_PACKS = [
  { pack: 'starter',  credits: 10,  price: '$5',  pricePerCredit: '$0.50', popular: false },
  { pack: 'standard', credits: 50,  price: '$18', pricePerCredit: '$0.36', popular: true  },
  { pack: 'pro',      credits: 150, price: '$45', pricePerCredit: '$0.30', popular: false },
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
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-4">
        <span className="h-px w-10" style={{ background: RED }} />
        <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: RED }}>
          Refuel
        </span>
      </div>
      <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-8">
        Buy credits<span style={{ color: VOLT }}>.</span>
      </h1>

      {success && (
        <div className="mb-8 border px-4 py-3 text-sm font-bold" style={{ borderColor: `${VOLT}66`, background: `${VOLT}10`, color: VOLT }}>
          Payment successful — credits have been added to your account.
        </div>
      )}
      {canceled && (
        <div className="mb-8 border border-white/15 bg-white/5 px-4 py-3 text-sm text-neutral-400">
          Payment canceled. No charges were made.
        </div>
      )}
      {buyError && (
        <div className="mb-8 border px-4 py-3 text-sm font-bold" style={{ borderColor: `${RED}66`, background: `${RED}10`, color: RED }}>
          {buyError}
        </div>
      )}

      {/* Balance card */}
      <div className="border border-white/10 bg-[#101010] p-6 mb-8 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-1">Current balance</p>
          <p className="text-4xl font-black italic" style={{ color: credits === 0 ? RED : VOLT }}>
            {credits} <span className="text-lg text-neutral-500 not-italic font-bold uppercase">credits</span>
          </p>
        </div>
        <div className="text-right text-[11px] text-neutral-600 uppercase tracking-wider leading-relaxed">
          <p>1 credit = 1 full session</p>
          <p>(code generation + AI evaluation)</p>
        </div>
      </div>

      {/* Credit packs */}
      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-4">Pick your pack</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {CREDIT_PACKS.map(({ pack, credits: c, price, pricePerCredit, popular }) => (
          <div
            key={pack}
            className={`relative bg-[#101010] border p-5 flex flex-col gap-4 transition-all hover:-translate-y-1 ${
              popular ? '' : 'border-white/10 hover:border-white/30'
            }`}
            style={popular ? { borderColor: VOLT } : undefined}
          >
            {popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase italic bg-[#ccff00] text-black px-3 py-1 -skew-x-6 whitespace-nowrap">
                <span className="inline-block skew-x-6">Best value</span>
              </span>
            )}
            <div>
              <p className="text-3xl font-black italic" style={{ color: popular ? VOLT : '#f5f5f3' }}>{c}</p>
              <p className="text-[10px] uppercase tracking-widest text-neutral-600">credits</p>
            </div>
            <div>
              <p className="text-xl font-black text-neutral-100">{price}</p>
              <p className="text-[11px] text-neutral-600">{pricePerCredit} / credit</p>
            </div>
            <button
              onClick={() => handleBuy(pack)}
              disabled={!!loading}
              className={`mt-auto py-2.5 text-xs font-black uppercase italic tracking-tight -skew-x-6 transition-all disabled:opacity-50 ${
                popular
                  ? 'bg-[#ccff00] hover:bg-[#b9eb00] text-black'
                  : 'border border-white/20 text-neutral-300 hover:border-white/50 hover:text-white'
              }`}
            >
              <span className="inline-block skew-x-6">
                {loading === pack ? 'Redirecting…' : `Buy ${c} credits`}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Transaction history */}
      {transactions.length > 0 && (
        <>
          <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-500 mb-4">Transaction history</p>
          <div className="border border-white/10 bg-[#101010] divide-y divide-white/5">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border shrink-0"
                    style={
                      tx.type === 'purchase'
                        ? { borderColor: `${VOLT}55`, color: VOLT }
                        : tx.type === 'bonus'
                        ? { borderColor: '#8fb33c55', color: '#8fb33c' }
                        : { borderColor: `${RED}55`, color: RED }
                    }
                  >
                    {tx.type}
                  </span>
                  <div className="min-w-0">
                    <p className="text-neutral-300 truncate">{tx.description ?? tx.type}</p>
                    <p className="text-[11px] text-neutral-600 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className="font-black italic shrink-0 ml-4"
                  style={{ color: tx.amount > 0 ? VOLT : RED }}
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
