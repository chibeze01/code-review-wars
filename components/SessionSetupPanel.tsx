'use client'

import { useState } from 'react'
import type { Language, Domain } from '@/types'

const LANGUAGES: Language[] = ['TypeScript', 'C#']

const DOMAINS: { id: Exclude<Domain, 'custom'>; label: string; sub: string }[] = [
  { id: 'ecommerce',  label: 'E-Commerce',  sub: 'Cart, orders, payments' },
  { id: 'fintech',    label: 'Fintech',      sub: 'Trades, P&L, compliance' },
  { id: 'healthcare', label: 'Healthcare',   sub: 'Records, billing, HIPAA' },
  { id: 'devtools',   label: 'Dev Tools',    sub: 'APIs, SDKs, pipelines' },
  { id: 'saas',       label: 'SaaS',         sub: 'Auth, billing, tenancy' },
  { id: 'general',    label: 'General',      sub: 'REST API, validation, DB' },
]

interface Props {
  onGenerate: (language: Language, domain: Domain, context?: string) => void
  loading: boolean
  credits: number
}

export function SessionSetupPanel({ onGenerate, loading, credits }: Props) {
  const [language, setLanguage] = useState<Language>('TypeScript')
  const [domain, setDomain] = useState<Domain>('ecommerce')
  const [context, setContext] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (credits === 0) return
    if (domain === 'custom' && !context.trim()) return
    onGenerate(language, domain, domain === 'custom' ? context.trim() : undefined)
  }

  const canSubmit = credits > 0 && !loading && (domain !== 'custom' || context.trim().length > 0)

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Language */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Language
        </label>
        <div className="flex gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`flex-1 py-2.5 text-xs font-black uppercase italic tracking-tight -skew-x-6 border transition-all ${
                language === lang
                  ? 'bg-[#ccff00] border-[#ccff00] text-black'
                  : 'bg-transparent border-white/15 text-neutral-400 hover:border-white/40 hover:text-white'
              }`}
            >
              <span className="inline-block skew-x-6">{lang}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Domain */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
          Domain
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDomain(d.id)}
              className={`px-2 py-2 text-left border transition-all ${
                domain === d.id
                  ? 'border-[#ccff00] bg-[#ccff00]/10'
                  : 'border-white/10 bg-[#0a0a0a] hover:border-white/25'
              }`}
            >
              <p className={`text-[11px] font-black uppercase italic leading-none ${domain === d.id ? 'text-[#ccff00]' : 'text-neutral-300'}`}>
                {d.label}
              </p>
              <p className="text-[10px] text-neutral-600 mt-0.5 leading-tight">{d.sub}</p>
            </button>
          ))}
        </div>

        {/* Custom option */}
        <button
          type="button"
          onClick={() => setDomain('custom')}
          className={`w-full px-3 py-2 border text-left transition-all ${
            domain === 'custom'
              ? 'border-[#ccff00] bg-[#ccff00]/10'
              : 'border-white/10 bg-[#0a0a0a] hover:border-white/25'
          }`}
        >
          <p className={`text-[11px] font-black uppercase italic ${domain === 'custom' ? 'text-[#ccff00]' : 'text-neutral-300'}`}>
            Custom
          </p>
          <p className="text-[10px] text-neutral-600">Describe your own scenario</p>
        </button>
      </div>

      {/* Custom context textarea */}
      {domain === 'custom' && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-500">
            Describe the context
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. 'Logistics startup, Node.js API tracking shipments and driver routes'"
            rows={3}
            className="w-full bg-[#0a0a0a] border border-white/15 px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-[#ccff00] resize-none transition-colors"
            required
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`mt-1 py-3 text-sm font-black uppercase italic tracking-tight -skew-x-6 transition-all disabled:cursor-not-allowed ${
          credits === 0
            ? 'border border-[#cf0a2c] text-[#cf0a2c]'
            : 'bg-[#ccff00] hover:bg-[#b9eb00] disabled:opacity-40 text-black'
        }`}
      >
        <span className="inline-block skew-x-6">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Generating…
            </span>
          ) : credits === 0 ? (
            'No credits — refuel →'
          ) : (
            'Generate code · 1 credit'
          )}
        </span>
      </button>
    </form>
  )
}
