'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

const IS_DEV = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function fillTestCredentials() {
    setEmail('admin@test.com')
    setPassword('admin123')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-white">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-black tracking-[0.3em] text-[var(--ink)]">
            SOLEMARK
          </h1>
          <p className="text-[0.65rem] tracking-[0.25em] text-[var(--stone)] mt-2 uppercase">
            Running Shoe Collection
          </p>
        </div>

        {IS_DEV && (
          <div className="mb-5 border border-[var(--border)] bg-white px-4 py-3 text-center">
            <p className="text-[0.65rem] tracking-widest text-[var(--stone)] uppercase font-semibold mb-1">Dev Mode</p>
            <p className="text-[0.65rem] text-[var(--stone-light)]">Local storage active</p>
            <button
              type="button"
              onClick={fillTestCredentials}
              className="mt-2 text-[0.65rem] tracking-wider text-[var(--ink)] underline hover:no-underline"
            >
              테스트 계정 자동 입력 ↓
            </button>
          </div>
        )}

        <div className="luxury-card p-8">
          <h2 className="text-xs font-semibold tracking-[0.2em] uppercase text-[var(--stone)] mb-7">
            Sign In
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
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
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[0.7rem] text-[var(--stone)] mt-7">
            No account?{' '}
            <Link href="/signup" className="text-[var(--ink)] underline hover:no-underline font-medium">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
