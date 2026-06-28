'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${location.origin}/` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setDone(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black tracking-[0.3em] text-[var(--ink)]">
            SOLEMARK
          </h1>
          <p className="text-[0.65rem] tracking-[0.25em] text-[var(--stone)] mt-2 uppercase">
            Running Shoe Collection
          </p>
        </div>

        <div className="luxury-card p-8">
          <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--stone)] mb-7">
            Create Account
          </h2>

          {done ? (
            <div className="text-center py-6">
              <p className="text-[var(--safe)] text-sm font-semibold tracking-wide mb-2">
                Account created!
              </p>
              <p className="text-xs text-[var(--stone)] leading-relaxed">
                Check your inbox and confirm your email to activate your account.
              </p>
              <button
                onClick={() => router.push('/login')}
                className="btn-primary mt-6 justify-center"
              >
                Go to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-[0.65rem] tracking-[0.12em] uppercase text-[var(--stone)] mb-1.5 font-medium">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="input-luxury"
                  placeholder="runner@example.com"
                />
              </div>
              <div>
                <label className="block text-[0.65rem] tracking-[0.12em] uppercase text-[var(--stone)] mb-1.5 font-medium">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="input-luxury"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[0.65rem] tracking-[0.12em] uppercase text-[var(--stone)] mb-1.5 font-medium">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  className="input-luxury"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="text-xs text-[var(--danger)] border border-[rgba(158,46,46,0.2)] bg-[rgba(158,46,46,0.04)] px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 mt-1"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          )}

          <p className="text-center text-[0.7rem] text-[var(--stone)] mt-7">
            Already have an account?{' '}
            <Link href="/login" className="text-[var(--ink)] underline hover:no-underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
