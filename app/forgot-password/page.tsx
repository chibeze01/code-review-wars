'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
    }
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
          <h1 className="font-display font-extrabold text-2xl">Forgot password?</h1>
          <p className="text-sm text-ink-2 mt-1">We&apos;ll email you a reset link</p>
        </div>

        {sent ? (
          <div className="card-pop p-6 text-center text-sm font-medium">
            📬 Check your inbox — if an account exists for {email}, a reset link is on its way.
          </div>
        ) : (
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
            <button type="submit" disabled={loading} className="btn-pop btn-pop-green w-full mt-1">
              {loading ? 'Sending…' : 'Send reset link →'}
            </button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-ink-2">
          Remembered it?{' '}
          <Link href="/login" className="font-bold text-brand hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
