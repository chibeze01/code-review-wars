'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-cream text-ink flex items-center justify-center p-4">
        <div className="card-pop p-8 w-full max-w-sm text-center">
          <div className="text-4xl mb-4">📧</div>
          <h2 className="font-display font-extrabold text-2xl">Check your email</h2>
          <p className="text-sm text-ink-2 mt-2 leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="font-bold text-ink">{email}</span>.{' '}
            Click it to activate your account and get your 3 free credits.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream text-ink flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex">
            <span className="w-12 h-12 border-2.5 border-ink rounded-[12px] bg-brand text-white grid place-items-center text-2xl shadow-hard-sm mx-auto mb-4">
              ⚔️
            </span>
          </Link>
          <h1 className="font-display font-extrabold text-2xl">Start for free</h1>
          <p className="text-sm text-ink-2 mt-1">Get 3 free credits on sign up — no card required</p>
        </div>

        <form onSubmit={handleSubmit} className="card-pop p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-coral-soft border-2 border-ink rounded-pop px-4 py-3 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full bg-paper border-2.5 border-ink rounded-pop px-3 py-2.5 text-sm text-ink placeholder-ink-3 focus:outline-none focus:bg-cream-2/40 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
              className="w-full bg-paper border-2.5 border-ink rounded-pop px-3 py-2.5 text-sm text-ink placeholder-ink-3 focus:outline-none focus:bg-cream-2/40 transition-colors"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-pop btn-pop-green w-full mt-1">
            {loading ? 'Creating account…' : '⚡ Create account — 3 free credits'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-2">
          Already have an account?{' '}
          <Link href="/login" className="font-bold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
