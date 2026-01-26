'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Sign up user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      // Check if email confirmation is required
      if (data.user && !data.session) {
        // Email confirmation required
        setError('Please check your email to confirm your account before signing in.')
        setLoading(false)
        return
      }

      // Profile will be auto-created by database trigger
      // Redirect directly to create group (skip home page redirect loop)
      if (data.session) {
        router.push('/groups/create')
        router.refresh()
      } else {
        // If no session, redirect to login with message
        router.push('/login?message=Please confirm your email first')
      }
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <main className="safe-area flex min-h-screen flex-col items-center justify-center overflow-x-hidden px-4 py-12 sm:px-6 sm:py-16">
      <div className="w-full max-w-sm space-y-6 sm:max-w-md sm:space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#8FA888] text-[#FBF8F3] shadow-xl shadow-[#8FA888]/20 sm:mb-6 sm:h-16 sm:w-16">
            <span className="text-base font-semibold tracking-tight sm:text-lg">BW</span>
          </div>
          <h1 className="text-2xl font-bold text-[#3D3D3D] sm:text-3xl">Join BudgetWise</h1>
          <p className="mt-2 text-xs text-[#6B6B6B] sm:mt-3 sm:text-sm">
            Start managing shared expenses with elegant clarity
          </p>
        </div>

        <div className="rounded-[24px] border border-white/60 bg-white/70 p-6 shadow-[0_18px_50px_rgba(61,61,61,0.08)] backdrop-blur-sm sm:rounded-[28px] sm:p-8">
          <h2 className="mb-5 text-lg font-semibold text-[#3D3D3D] sm:mb-6 sm:text-xl">
            Create account
          </h2>

          <form onSubmit={handleSignup} className="space-y-4">
            {error && (
              <div className="rounded-md bg-[#F5DCC8]/60 p-3 text-sm text-[#9A6D4B]">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="displayName"
                className="block text-sm font-medium text-[#4A4A4A]"
              >
                Display Name (optional)
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-1 block w-full rounded-2xl border border-[#E5E0D8] bg-white/80 px-4 py-3 text-sm text-[#4A4A4A] shadow-sm focus:border-[#8FA888] focus:outline-none focus:ring-2 focus:ring-[#8FA888]/25"
                placeholder="John"
              />
            </div>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-2xl border border-[#E5E0D8] bg-white/80 px-4 py-3 text-sm text-[#4A4A4A] shadow-sm focus:border-[#8FA888] focus:outline-none focus:ring-2 focus:ring-[#8FA888]/25"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-[#6B6B6B]">
                Must be at least 6 characters
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#8FA888] px-6 py-3 text-base font-semibold text-[#FBF8F3] shadow-lg shadow-[#8FA888]/20 transition hover:bg-[#7E9676] focus:outline-none focus:ring-2 focus:ring-[#8FA888]/30 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-[#6B6B6B]">Already have an account? </span>
            <Link
              href="/login"
              className="font-medium text-[#4A4A4A] hover:text-[#8FA888] hover:underline"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}