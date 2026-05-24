import { useState } from 'react'
import type { Language } from '../types'

const LANGUAGES: Language[] = ['TypeScript', 'C#']

const EXAMPLE_CONTEXTS = [
  'E-commerce platform backend — Node/TS microservice handling product catalog, cart operations, and order processing on AWS',
  'Investment portfolio management system — C# .NET API tracking trades, P&L calculations, and compliance checks',
  'Healthcare records API — handling patient data, appointment scheduling, and insurance billing',
  'Fintech payments service — processing transactions, fraud detection, and regulatory reporting',
]

interface Props {
  onGenerate: (apiKey: string, language: Language, context: string) => void
  loading: boolean
}

export function SetupPanel({ onGenerate, loading }: Props) {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('crw_api_key') ?? '')
  const [language, setLanguage] = useState<Language>('TypeScript')
  const [context, setContext] = useState('')
  const [showKey, setShowKey] = useState(false)

  function handleApiKeyChange(val: string) {
    setApiKey(val)
    localStorage.setItem('crw_api_key', val)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!apiKey.trim() || !context.trim()) return
    onGenerate(apiKey.trim(), language, context.trim())
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* API Key */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Anthropic API Key
        </label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            placeholder="sk-ant-..."
            className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 pr-16"
            required
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showKey ? 'Hide' : 'Show'}
          </button>
        </div>
        <p className="text-xs text-slate-600">Stored locally in your browser. Never sent anywhere except Anthropic.</p>
      </div>

      {/* Language */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Language
        </label>
        <div className="flex gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setLanguage(lang)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                language === lang
                  ? 'bg-violet-600 border-violet-500 text-white'
                  : 'bg-[#161b22] border-[#30363d] text-slate-400 hover:border-slate-500 hover:text-slate-300'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      {/* Context */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Context / Scenario
        </label>
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Describe the company, domain, and role. e.g. 'E-commerce startup, backend engineer maintaining a Node.js API on AWS that handles order processing and payments'"
          rows={4}
          className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-3 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 resize-none"
          required
        />
        <div className="flex flex-col gap-1 mt-1">
          <p className="text-xs text-slate-600">Examples:</p>
          {EXAMPLE_CONTEXTS.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setContext(ex)}
              className="text-left text-xs text-slate-600 hover:text-violet-400 transition-colors line-clamp-1 py-0.5"
            >
              → {ex}
            </button>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading || !apiKey.trim() || !context.trim()}
        className="mt-1 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating code…
          </span>
        ) : (
          'Generate Code to Review'
        )}
      </button>
    </form>
  )
}
