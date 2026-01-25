import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import HomeSessionRedirect from '@/components/auth/HomeSessionRedirect'

export default async function Home() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    // If user is logged in, check if they have groups
    if (!authError && user) {
      try {
        const { data: groups, error } = await supabase
          .from('group_members')
          .select('group_id')
          .eq('user_id', user.id)
          .limit(1)

        // Redirect to dashboard if they have groups, otherwise to create group
        // Error handling: if table doesn't exist yet, redirect to create group
        if (!error && groups && groups.length > 0) {
          redirect('/dashboard')
        } else {
          redirect('/groups/create')
        }
      } catch (err) {
        // If there's an error (e.g., table doesn't exist), redirect to create group
        redirect('/groups/create')
      }
    }
  } catch (err) {
    // If Supabase client creation fails (e.g., env vars missing), show welcome page
    // This prevents redirect loops when env vars are not configured
  }

  // Not logged in - show welcome/onboarding screen
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#FBF8F3] px-6 py-16 text-[#4A4A4A]">
      <HomeSessionRedirect />
      <div className="noise-overlay" />

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-5%] h-[45%] w-[45%] bg-[#8FA888]/10 blob-shape animate-pulse" />
        <div
          className="absolute top-[10%] right-[-10%] h-[35%] w-[35%] bg-[#F5DCC8]/20 blob-shape"
          style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
        />
        <div
          className="absolute bottom-[-5%] left-[10%] h-[40%] w-[40%] bg-[#F5DCC8]/15 blob-shape"
          style={{ borderRadius: '70% 30% 50% 50% / 30% 50% 70% 60%' }}
        />
        <div
          className="absolute bottom-[10%] right-[-5%] h-[30%] w-[30%] bg-[#8FA888]/10 blob-shape"
          style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
        />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-3xl flex-col items-center justify-center text-center">
        <div className="space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[32px] bg-[#8FA888] text-[#FBF8F3] shadow-xl shadow-[#8FA888]/20">
            <span className="text-2xl font-semibold tracking-tight">BW</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-[#3D3D3D] sm:text-6xl">
            BudgetWise
          </h1>
          <p className="text-xl font-medium text-[#6B6B6B] sm:text-2xl">
            Elevate shared spending with calm, precise control
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-[#6B6B6B]">
            {[
              'Executive Budgets',
              'Equitable Splits',
              'Precision per Expense',
              'Draft, Review, Confirm',
            ].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/60 bg-white/60 px-4 py-1.5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-sm"
              >
                {item}
              </span>
            ))}
          </div>
          <p className="text-sm text-[#6B6B6B]">
            Sign in or create an account to continue.
          </p>
        </div>

        <div className="mt-10 flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
          <Link
            href="/signup"
            className="flex items-center justify-center gap-2 rounded-full bg-[#8FA888] px-8 py-4 text-lg font-semibold text-[#FBF8F3] shadow-lg shadow-[#8FA888]/20 transition hover:bg-[#7E9676] focus:outline-none focus:ring-2 focus:ring-[#8FA888]/30 focus:ring-offset-2"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="rounded-full border-2 border-[#E5E0D8] bg-white/50 px-8 py-4 text-lg font-semibold text-[#6B6B6B] shadow-sm transition hover:border-[#8FA888] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[#8FA888]/20 focus:ring-offset-2"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  )
}