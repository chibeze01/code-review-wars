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
        <label className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2">
          Language
        </label>
        <div className="flex gap-2.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`flex-1 py-2.5 font-display font-bold text-[13px] border-2.5 border-ink rounded-pop transition-all ${
                language === lang
                  ? 'bg-brand-soft shadow-hard-sm'
                  : 'bg-paper text-ink-2 hover:bg-cream-2'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Domain */}
      <div className="flex flex-col gap-1.5">
        <label className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2">
          Domain
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setDomain(d.id)}
              className={`px-2.5 py-2 text-left border-2.5 border-ink rounded-pop transition-all ${
                domain === d.id ? 'bg-brand-soft shadow-hard-sm' : 'bg-paper hover:bg-cream-2'
              }`}
            >
              <p className="font-display font-bold text-[11px] leading-none">
                {d.label}
              </p>
              <p className="text-[10px] text-ink-3 mt-1 leading-tight">{d.sub}</p>
            </button>
          ))}
        </div>

        {/* Custom option */}
        <button
          type="button"
          onClick={() => setDomain('custom')}
          className={`w-full px-3 py-2 border-2.5 border-ink rounded-pop text-left transition-all ${
            domain === 'custom' ? 'bg-brand-soft shadow-hard-sm' : 'bg-paper hover:bg-cream-2'
          }`}
        >
          <p className="font-display font-bold text-[11px]">✏️ Custom</p>
          <p className="text-[10px] text-ink-3">Describe your own scenario</p>
        </button>
      </div>

      {/* Custom context textarea */}
      {domain === 'custom' && (
        <div className="flex flex-col gap-1.5">
          <label className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2">
            Describe the context
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="e.g. 'Logistics startup, Node.js API tracking shipments and driver routes'"
            rows={3}
            className="w-full bg-paper border-2.5 border-ink rounded-pop px-3 py-2.5 text-sm text-ink placeholder-ink-3 focus:outline-none focus:bg-cream-2/50 resize-none transition-colors"
            required
          />
        </div>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className={`btn-pop w-full mt-1 ${credits === 0 ? 'bg-coral-soft' : 'btn-pop-green'}`}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating…
          </span>
        ) : credits === 0 ? (
          'No credits — top up →'
        ) : (
          '🎯 Generate code · 1 credit'
        )}
      </button>
    </form>
  )
}
