'use client'

import { useState } from 'react'
import Link from 'next/link'

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
    <div className="min-h-screen bg-[#0d1117]">
      <header className="border-b border-[#21262d] bg-[#161b22] px-6 py-4 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white font-bold text-sm">
            CR
          </div>
          <span className="text-base font-bold text-slate-100">Code Review Wars</span>
        </Link>
        <Link href="/dashboard" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          ← Back to dashboard
        </Link>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-12">
        {success && (
          <div className="mb-8 bg-emerald-500/10 border border-emerald-500/30 rounded-lg px-4 py-3 text-sm text-emerald-400">
            Payment successful — credits have been added to your account.
          </div>
        )}
        {canceled && (
          <div className="mb-8 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-sm text-yellow-400">
            Payment canceled. No charges were made.
          </div>
        )}
        {buyError && (
          <div className="mb-8 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
            {buyError}
          </div>
        )}

        {/* Balance card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Current balance</p>
            <p className="text-3xl font-bold text-violet-400">
              {credits} <span className="text-xl text-slate-400">credits</span>
            </p>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>1 credit = 1 full review session</p>
            <p className="mt-1">(code generation + AI evaluation)</p>
          </div>
        </div>

        {/* Credit packs */}
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Buy credits</h2>
        <div className="grid grid-cols-3 gap-4 mb-8">
          {CREDIT_PACKS.map(({ pack, credits: c, price, pricePerCredit, popular }) => (
            <div
              key={pack}
              className={`relative bg-[#161b22] border rounded-xl p-5 flex flex-col gap-3 ${
                popular ? 'border-violet-500' : 'border-[#30363d]'
              }`}
            >
              {popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-xs font-semibold bg-violet-600 text-white px-3 py-0.5 rounded-full whitespace-nowrap">
                  Best value
                </span>
              )}
              <div>
                <p className="text-2xl font-bold text-slate-100">{c}</p>
                <p className="text-xs text-slate-500">credits</p>
              </div>
              <div>
                <p className="text-xl font-bold text-slate-200">{price}</p>
                <p className="text-xs text-slate-600">{pricePerCredit} / credit</p>
              </div>
              <button
                onClick={() => handleBuy(pack)}
                disabled={!!loading}
                className={`mt-auto py-2.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                  popular
                    ? 'bg-violet-600 hover:bg-violet-500 text-white'
                    : 'bg-[#21262d] hover:bg-[#30363d] text-slate-300 border border-[#30363d]'
                }`}
              >
                {loading === pack ? 'Redirecting…' : `Buy ${c} credits`}
              </button>
            </div>
          ))}
        </div>

        {/* Transaction history */}
        {transactions.length > 0 && (
          <>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">Transaction history</h2>
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden">
              {transactions.map((tx, i) => (
                <div
                  key={tx.id}
                  className={`flex items-center justify-between px-4 py-3 text-sm ${
                    i < transactions.length - 1 ? 'border-b border-[#21262d]' : ''
                  }`}
                >
                  <div>
                    <p className="text-slate-300">{tx.description ?? tx.type}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`font-semibold ${tx.amount > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
