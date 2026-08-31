'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
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
          <h1 className="font-display font-extrabold text-2xl">Set a new password</h1>
          <p className="text-sm text-ink-2 mt-1">Choose a new password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card-pop p-6 flex flex-col gap-4">
          {error && (
            <div className="bg-coral-soft border-2 border-ink rounded-pop px-4 py-3 text-sm font-medium">
              ⚠️ {error}
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="font-display font-bold text-[13px] uppercase tracking-[0.08em] text-ink-2">New password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
              className="w-full bg-paper border-2.5 border-ink rounded-pop px-3 py-2.5 text-sm text-ink placeholder-ink-3 focus:outline-none focus:bg-cream-2/40 transition-colors"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-pop btn-pop-green w-full mt-1">
            {loading ? 'Updating…' : 'Update password →'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-2">
          Link expired?{' '}
          <Link href="/forgot-password" className="font-bold text-brand hover:underline">
            Request a new one
          </Link>
        </p>
      </div>
    </div>
  )
}
