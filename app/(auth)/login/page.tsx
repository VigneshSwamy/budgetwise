'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setError(message)
    }
  }, [searchParams])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      // Check if user has groups, redirect accordingly
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: groups } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .limit(1)

        if (groups && groups.length > 0) {
          router.push('/dashboard')
        } else {
          router.push('/groups/create')
        }
        router.refresh()
      } else {
        router.push('/groups/create')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[24px] bg-[#8FA888] text-[#FBF8F3] shadow-xl shadow-[#8FA888]/20">
            <span className="text-lg font-semibold tracking-tight">BW</span>
          </div>
          <h1 className="text-3xl font-bold text-[#3D3D3D]">Welcome back</h1>
          <p className="mt-3 text-sm text-[#6B6B6B]">
            Elevate shared spending with calm, precise control
          </p>
        </div>

        <div className="rounded-[28px] border border-white/60 bg-white/70 p-8 shadow-[0_18px_50px_rgba(61,61,61,0.08)] backdrop-blur-sm">
          <h2 className="mb-6 text-xl font-semibold text-[#3D3D3D]">Sign in</h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="rounded-md bg-[#F5DCC8]/60 p-3 text-sm text-[#9A6D4B]">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-[#4A4A4A]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-2xl border border-[#E5E0D8] bg-white/80 px-4 py-3 text-sm text-[#4A4A4A] shadow-sm focus:border-[#8FA888] focus:outline-none focus:ring-2 focus:ring-[#8FA888]/25"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-[#4A4A4A]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-2xl border border-[#E5E0D8] bg-white/80 px-4 py-3 text-sm text-[#4A4A4A] shadow-sm focus:border-[#8FA888] focus:outline-none focus:ring-2 focus:ring-[#8FA888]/25"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#8FA888] px-6 py-3 text-base font-semibold text-[#FBF8F3] shadow-lg shadow-[#8FA888]/20 transition hover:bg-[#7E9676] focus:outline-none focus:ring-2 focus:ring-[#8FA888]/30 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-[#6B6B6B]">Don&apos;t have an account? </span>
            <Link
              href="/signup"
              className="font-medium text-[#4A4A4A] hover:text-[#8FA888] hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center text-sm text-[#6B6B6B]">Loading...</div>}
    >
      <LoginContent />
    </Suspense>
  )
}