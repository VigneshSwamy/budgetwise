import Link from 'next/link'
import { getUserAndFirstGroup } from '@/lib/groups/getUserGroup'

export default async function ReportsPage() {
  const { supabase, firstGroupId } = await getUserAndFirstGroup()

  if (!firstGroupId) {
    return (
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Reports & Insights</h1>
          <p className="text-stone-500">Analyze your spending habits over time.</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-soft-md">
          <p className="mb-4 text-stone-600">Create a group to view reports.</p>
          <Link
            href="/groups/create"
            className="inline-flex items-center rounded-lg bg-[#1f6f5b] px-4 py-2 text-sm font-medium text-white shadow-soft-sm hover:bg-[#195a4a]"
          >
            Create group
          </Link>
        </div>
      </main>
    )
  }

  const now = new Date()
  const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const daysSoFar = Math.max(now.getDate(), 1)

  const { data: wallet } = await supabase
    .from('wallet_remaining')
    .select('budget_amount, spent_amount, remaining_amount')
    .eq('group_id', firstGroupId)
    .eq('period_key', periodKey)
    .single()

  const totalSpent = Number(wallet?.spent_amount || 0)
  const totalBudget = Number(wallet?.budget_amount || 0)
  const remaining = Number(wallet?.remaining_amount || 0)
  const averageDaily = totalSpent / daysSoFar

  const { data: insights } = await supabase.rpc('get_insights', {
    group_id: firstGroupId,
    period_key: periodKey,
  })

  const topCategory = insights?.top_categories?.[0]

  return (
    <main className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Reports & Insights</h1>
        <p className="text-stone-500">Analyze your spending habits over time.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">Total Spent</p>
              <p className="mt-2 text-3xl font-semibold text-stone-900">
                ${totalSpent.toFixed(2)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
              ↓
            </div>
          </div>
          <p className="mt-4 text-sm text-stone-500">
            {totalBudget > 0 ? `${Math.round((totalSpent / totalBudget) * 100)}%` : '0%'} of
            budget used
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">Average Daily</p>
              <p className="mt-2 text-3xl font-semibold text-stone-900">
                ${averageDaily.toFixed(2)}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-sage-700">
              ↗
            </div>
          </div>
          <p className="mt-4 text-sm text-stone-500">
            {remaining > 0 ? `Projected to save $${remaining.toFixed(0)}` : 'No savings yet'}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">Highest Category</p>
              <p className="mt-2 text-2xl font-semibold text-stone-900">
                {topCategory?.name || 'No data'}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-100 text-stone-500">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
                <path
                  d="M4 11l8-6 8 6v8a2 2 0 0 1-2 2h-3v-6H9v6H6a2 2 0 0 1-2-2z"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
          <p className="mt-4 text-sm text-stone-500">
            {topCategory
              ? `$${Number(topCategory.total || 0).toFixed(0)} spent`
              : 'Track more expenses to see top categories.'}
          </p>
        </div>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft-md">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">Spending Trend (6 Months)</h2>
          <span className="text-sm text-stone-400">Needs 3+ months of data</span>
        </div>
        <div className="mt-6 flex h-64 items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-gradient-to-b from-sage-50 to-white text-sm text-stone-400">
          Trend chart will appear once you have more historical data.
        </div>
      </section>
    </main>
  )
}
