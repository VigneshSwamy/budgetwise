import Link from 'next/link'
import { getUserAndFirstGroup } from '@/lib/groups/getUserGroup'
import { CategoryIcon } from '@/components/shared/CategoryIcon'

export default async function TransactionsPage() {
  const { supabase, firstGroupId } = await getUserAndFirstGroup()

  if (!firstGroupId) {
    return (
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Transactions</h1>
          <p className="text-stone-500">Track spending across your group.</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-soft-md">
          <p className="mb-4 text-stone-600">
            Create a group first to start tracking transactions.
          </p>
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

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, merchant, amount, date, category')
    .eq('group_id', firstGroupId)
    .eq('period_key', periodKey)
    .order('date', { ascending: false })

  const transactions =
    expenses?.map((expense) => ({
      id: expense.id,
      name: expense.merchant || 'Untitled expense',
      category: expense.category || 'Uncategorized',
      amount: Number(expense.amount),
      date: expense.date,
    })) || []

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Transactions</h1>
          <p className="text-stone-500">Track and review recent spending.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-600 shadow-soft-sm">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
              <path
                d="M3 5h18l-6 7v5l-6 2v-7L3 5z"
                strokeWidth="1.8"
                strokeLinejoin="round"
              />
            </svg>
            Filter
          </button>
          <Link
            href={`/groups/${firstGroupId}/expenses/new`}
            className="inline-flex items-center gap-2 rounded-lg bg-[#2a7d66] px-4 py-2 text-sm font-medium text-white shadow-soft-sm hover:bg-[#1f6f5b]"
          >
            <span className="text-lg">+</span>
            Add New
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-soft-md">
        <div className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-stone-500">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="6" strokeWidth="1.8" />
            <path d="M16.5 16.5L21 21" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search transactions..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
          />
        </div>
      </div>

      <section className="rounded-xl border border-stone-200 bg-white shadow-soft-md">
        <div className="border-b border-stone-100 px-6 py-4 text-sm font-semibold tracking-wide text-stone-400">
          EARLIER
        </div>
        {transactions.length > 0 ? (
          <div className="divide-y divide-stone-100">
            {transactions.map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-4">
                  <CategoryIcon category={tx.category} />
                  <div>
                    <p className="font-medium text-stone-900">{tx.name}</p>
                    <p className="text-sm text-stone-500">{tx.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-stone-900">-${tx.amount.toFixed(2)}</p>
                  <p className="text-xs text-stone-400">{tx.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-6 py-8 text-center text-sm text-stone-500">
            No transactions yet for this period.
          </div>
        )}
      </section>
    </main>
  )
}
