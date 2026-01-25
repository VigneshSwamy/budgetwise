import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function InsightsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  try {
    const { data: member, error } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('group_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !member) {
      redirect('/dashboard')
    }
  } catch (err) {
    redirect('/dashboard')
  }

  const now = new Date()
  const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const { data: insights } = await supabase.rpc('get_insights', {
    group_id: params.id,
    period_key: periodKey,
  })

  const topMerchants = insights?.top_merchants || []
  const topCategories = insights?.top_categories || []
  const breakdown = insights?.budget_impact_breakdown || {
    budget_impact: 0,
    split_only: 0,
  }
  const totalSpend =
    Number(breakdown.budget_impact || 0) + Number(breakdown.split_only || 0)
  const merchantMax =
    topMerchants.length > 0
      ? Math.max(...topMerchants.map((item: { total: number }) => Number(item.total)))
      : 0
  const categoryMax =
    topCategories.length > 0
      ? Math.max(...topCategories.map((item: { total: number }) => Number(item.total)))
      : 0

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Insights</h1>
            <p className="text-sm text-stone-500">
              Highlights for {periodKey}
            </p>
          </div>
          <Link
            href={`/groups/${params.id}/expenses`}
            className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
          >
            Back to expenses
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
            <h2 className="text-lg font-semibold text-stone-900">Top Merchants</h2>
            {topMerchants.length > 0 ? (
              <div className="mt-4 space-y-3">
                {topMerchants.map((item: { name: string; total: number }) => {
                  const percent = merchantMax
                    ? (Number(item.total) / merchantMax) * 100
                    : 0
                  return (
                    <div key={item.name} className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-700">{item.name}</span>
                        <span className="font-medium text-stone-900">
                          ${Number(item.total).toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100">
                        <div
                          className="h-2 rounded-full bg-sage-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-500">No data yet.</p>
            )}
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
            <h2 className="text-lg font-semibold text-stone-900">Top Categories</h2>
            {topCategories.length > 0 ? (
              <div className="mt-4 space-y-3">
                {topCategories.map((item: { name: string; total: number }) => {
                  const percent = categoryMax
                    ? (Number(item.total) / categoryMax) * 100
                    : 0
                  return (
                    <div key={item.name} className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-stone-700">{item.name}</span>
                        <span className="font-medium text-stone-900">
                          ${Number(item.total).toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100">
                        <div
                          className="h-2 rounded-full bg-amber-400"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-500">No data yet.</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
          <h2 className="text-lg font-semibold text-stone-900">
            Budget Impact vs Split-only
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Total spend: ${totalSpend.toFixed(2)}
          </p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Budget impact</p>
              <p className="text-2xl font-bold text-stone-900">
                ${Number(breakdown.budget_impact || 0).toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg border border-stone-100 bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Split-only</p>
              <p className="text-2xl font-bold text-stone-900">
                ${Number(breakdown.split_only || 0).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-3 bg-sage-500"
              style={{
                width: totalSpend ? `${(Number(breakdown.budget_impact || 0) / totalSpend) * 100}%` : '0%',
              }}
            />
          </div>
        </div>
      </div>
    </main>
  )
}
