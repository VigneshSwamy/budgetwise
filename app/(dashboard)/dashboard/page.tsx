import Link from 'next/link'
import AddTransactionChooser from '@/components/expenses/AddTransactionChooser'
import { CategoryIcon } from '@/components/shared/CategoryIcon'
import { getUserAndFirstGroup } from '@/lib/groups/getUserGroup'

export default async function DashboardPage() {
  const { supabase, groups, firstGroupId, groupName } = await getUserAndFirstGroup()

  const now = new Date()
  const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  let totalBudget = 0
  let totalSpent = 0
  let remaining = 0
  let statusLabel = 'On Track'
  let transactions: {
    id: string
    name: string
    category: string | null
    amount: number
    date: string
  }[] = []
  let categories: { id: string; name: string; spent: number }[] = []
  let balances: { user_id: string; display_name: string | null; net_balance: number }[] = []
  let impactBreakdown: { budget_impact: number; split_only: number } | null = null
  let drafts: { id: string; merchant: string | null; amount: number; date: string }[] = []

  if (firstGroupId) {
    const { data: dashboardData } = await supabase.rpc('get_dashboard', {
      group_id: firstGroupId,
      period_key: periodKey,
    })

    if (dashboardData) {
      const wallet = dashboardData.wallet_remaining
      if (wallet) {
        totalBudget = Number(wallet.budget_amount || 0)
        totalSpent = Number(wallet.spent_amount || 0)
        remaining = Number(wallet.remaining_amount || 0)
        statusLabel = totalSpent > totalBudget ? 'Over Budget' : 'On Track'
      }

      const recentExpenses = dashboardData.recent_expenses || []
      transactions = recentExpenses.map(
        (expense: {
          id: string
          merchant: string | null
          amount: number
          date: string
          category: string | null
        }) => ({
          id: expense.id,
          name: expense.merchant || 'Untitled expense',
          category: expense.category || 'Uncategorized',
          amount: Number(expense.amount),
          date: expense.date,
        })
      )
    } else {
      const { data: wallet } = await supabase
        .from('wallet_remaining')
        .select('budget_amount, spent_amount, remaining_amount')
        .eq('group_id', firstGroupId)
        .eq('period_key', periodKey)
        .single()

      if (wallet) {
        totalBudget = Number(wallet.budget_amount || 0)
        totalSpent = Number(wallet.spent_amount || 0)
        remaining = Number(wallet.remaining_amount || 0)
        statusLabel = totalSpent > totalBudget ? 'Over Budget' : 'On Track'
      }

      const { data: expenses } = await supabase
        .from('expenses')
        .select('id, merchant, amount, date, category')
        .eq('group_id', firstGroupId)
        .eq('period_key', periodKey)
        .order('date', { ascending: false })
        .limit(5)

      transactions = (expenses || []).map((expense) => ({
        id: expense.id,
        name: expense.merchant || 'Untitled expense',
        category: expense.category || 'Uncategorized',
        amount: Number(expense.amount),
        date: expense.date,
      }))
    }

    const { data: draftRows } = await supabase
      .from('expense_drafts')
      .select('id, merchant, amount, date')
      .eq('group_id', firstGroupId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(4)

    drafts =
      draftRows?.map((draft) => ({
        id: draft.id,
        merchant: draft.merchant,
        amount: Number(draft.amount),
        date: draft.date,
      })) || []

    const { data: categoryExpenses } = await supabase
      .from('expenses')
      .select('category, amount')
      .eq('group_id', firstGroupId)
      .eq('period_key', periodKey)

    const categoryTotals = new Map<string, number>()
    ;(categoryExpenses || []).forEach((expense) => {
      const name = expense.category || 'Uncategorized'
      categoryTotals.set(name, (categoryTotals.get(name) || 0) + Number(expense.amount))
    })

    categories = Array.from(categoryTotals.entries())
      .map(([name, spent]) => ({ id: name, name, spent }))
      .sort((a, b) => b.spent - a.spent)
      .slice(0, 5)

    let balanceRows = dashboardData?.balances || []
    if (balanceRows.length === 0) {
      const { data: directBalances } = await supabase.rpc('get_balances', {
        group_id: firstGroupId,
        period_key: periodKey,
      })
      balanceRows = directBalances || []
    }

    balances = balanceRows.map(
      (row: { user_id: string; display_name: string | null; net_balance: number }) => ({
        user_id: row.user_id,
        display_name: row.display_name,
        net_balance: Number(row.net_balance),
      })
    )

    const { data: insights } = await supabase.rpc('get_insights', {
      group_id: firstGroupId,
      period_key: periodKey,
    })

    if (insights?.budget_impact_breakdown) {
      impactBreakdown = {
        budget_impact: Number(insights.budget_impact_breakdown.budget_impact || 0),
        split_only: Number(insights.budget_impact_breakdown.split_only || 0),
      }
    }
  }

  const percentUsed =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0
  const categoryColors = ['#8B9D83', '#D4A574', '#C89B8C', '#8B9D83', '#D4A574']

  return (
    <main className="safe-area-bottom mx-auto w-full max-w-6xl space-y-6 overflow-x-hidden sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-bold text-stone-900 sm:text-2xl">Dashboard</h1>
          <p className="text-xs text-stone-500 sm:text-base">
            Welcome back{groupName ? `, ${groupName}` : ''}. Here&apos;s your financial overview.
          </p>
        </div>
        {firstGroupId ? (
          <AddTransactionChooser
            groupId={firstGroupId}
            buttonClassName="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#2a7d66] px-4 py-2 text-sm font-medium text-white shadow-soft-md hover:bg-[#1f6f5b] sm:w-auto"
          />
        ) : (
          <Link
            href="/groups/create"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1f6f5b] px-4 py-2 text-sm font-medium text-white shadow-soft-md hover:bg-[#195a4a] sm:w-auto"
          >
            + Create Group
          </Link>
        )}
      </div>

        {groups.length === 0 ? (
          <div className="rounded-xl border border-stone-200 bg-white p-6 text-center shadow-soft-md sm:p-8">
            <p className="mb-4 text-stone-600">
              You don&apos;t have any groups yet. Create one to start tracking.
            </p>
            <Link
              href="/groups/create"
              className="inline-block rounded-md bg-[#1f6f5b] px-4 py-2 font-medium text-white shadow-soft-sm hover:bg-[#195a4a]"
            >
              Create your first group
            </Link>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-soft-md sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-stone-500">Monthly Budget</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-3xl font-bold text-stone-900 sm:text-4xl">
                      ${totalSpent.toFixed(2)}
                    </span>
                    <span className="text-stone-400">
                      / ${totalBudget.toLocaleString()}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1.5 text-xs font-medium sm:px-4 sm:py-2 sm:text-sm ${
                    totalSpent > totalBudget
                      ? 'bg-terracotta-100 text-terracotta-700'
                      : 'bg-sage-100 text-sage-700'
                  }`}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="mt-6 space-y-2">
                <div className="flex justify-between text-sm text-stone-500">
                  <span>{Math.round(percentUsed)}% used</span>
                  <span>${remaining.toFixed(2)} remaining</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-stone-100">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: `${percentUsed}%`,
                      backgroundColor:
                        percentUsed > 85
                          ? '#C89B8C'
                          : percentUsed > 50
                          ? '#D4A574'
                          : '#8B9D83',
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-stone-800">Recent Transactions</h2>
                  {firstGroupId && (
                    <Link
                      href={`/groups/${firstGroupId}/expenses`}
                      className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
                    >
                      View All
                    </Link>
                  )}
                </div>
                <div className="rounded-xl border border-stone-200 bg-white shadow-soft-md">
                  {transactions.length > 0 ? (
                    <div className="divide-y divide-stone-100">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-start justify-between gap-3 p-3 sm:items-center sm:p-4">
                          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                            <CategoryIcon category={tx.category} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-stone-900">{tx.name}</p>
                              <p className="text-xs text-stone-500 sm:text-sm">{tx.category}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-stone-900 sm:text-base">
                              -${tx.amount.toFixed(2)}
                            </p>
                            <p className="text-[11px] text-stone-400 sm:text-xs">{tx.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-sm text-stone-500">
                      No expenses yet for this period.
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-stone-800">Draft Expenses</h2>
                  {firstGroupId && (
                    <Link
                      href={`/groups/${firstGroupId}/expenses/drafts`}
                      className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
                    >
                      Review
                    </Link>
                  )}
                </div>
                <div className="rounded-xl border border-stone-200 bg-white shadow-soft-md">
                  {drafts.length > 0 ? (
                    <div className="divide-y divide-stone-100">
                      {drafts.map((draft) => (
                        <div key={draft.id} className="flex items-start justify-between gap-3 p-3 sm:items-center sm:p-4">
                          <div className="min-w-0">
                            <p className="truncate font-medium text-stone-900">
                              {draft.merchant || 'Untitled draft'}
                            </p>
                            <p className="text-[11px] text-stone-500 sm:text-xs">{draft.date}</p>
                          </div>
                          <p className="text-sm font-semibold text-stone-800 sm:text-base">
                            ${draft.amount.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-sm text-stone-500">
                      No drafts yet. Import a statement or add a draft.
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-stone-800">Top Categories</h2>
                  <Link
                    href={firstGroupId ? `/groups/${firstGroupId}/insights` : '/groups/create'}
                    className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
                  >
                    Manage
                  </Link>
                </div>
                <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
                  {categories.length > 0 ? (
                    <div className="space-y-6">
                      {categories.map((cat, index) => {
                        const percent = totalSpent
                          ? Math.min((cat.spent / totalSpent) * 100, 100)
                          : 0
                        const barColor = categoryColors[index % categoryColors.length]
                        return (
                          <div key={cat.id}>
                            <div className="flex justify-between text-sm text-stone-600">
                              <span className="font-medium text-stone-700">{cat.name}</span>
                              <span>${cat.spent.toFixed(0)}</span>
                            </div>
                          <div className="mt-2 h-2 w-full rounded-full bg-stone-100">
                            <div
                              className="h-2 rounded-full"
                              style={{ width: `${percent}%`, backgroundColor: barColor }}
                            />
                          </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-stone-500">
                      No category data yet.
                    </div>
                  )}
                </div>
              </section>
            </div>

            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-stone-800">Balances</h2>
                <span className="text-sm text-stone-500">Net position</span>
              </div>
              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
                {balances.length > 0 ? (
                  <div className="space-y-3">
                    {balances.map((balance) => (
                      <div
                        key={balance.user_id}
                        className="flex items-center justify-between rounded-lg border border-stone-100 px-4 py-3"
                      >
                        <div className="text-sm font-medium text-stone-700">
                          {balance.display_name || `Member ${balance.user_id.slice(0, 6)}`}
                        </div>
                        <div
                          className={`text-sm font-semibold ${
                            balance.net_balance >= 0
                              ? 'text-sage-700'
                              : 'text-terracotta-600'
                          }`}
                        >
                          {balance.net_balance >= 0 ? '+' : '-'}$
                          {Math.abs(balance.net_balance).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-stone-500">
                    No balances yet.
                  </div>
                )}
              </div>
            </section>

            {impactBreakdown ? (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-stone-800">
                    Budget Impact
                  </h2>
                  <Link
                    href={firstGroupId ? `/groups/${firstGroupId}/insights` : '/groups/create'}
                    className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
                  >
                    View insights
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-soft-md">
                    <p className="text-sm text-stone-500">Budget impact</p>
                    <p className="text-2xl font-semibold text-stone-900">
                      ${impactBreakdown.budget_impact.toFixed(2)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-soft-md">
                    <p className="text-sm text-stone-500">Split-only</p>
                    <p className="text-2xl font-semibold text-stone-900">
                      ${impactBreakdown.split_only.toFixed(2)}
                    </p>
                  </div>
                </div>
              </section>
            ) : null}
          </>
        )}
    </main>
  )
}