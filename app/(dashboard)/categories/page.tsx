import Link from 'next/link'
import { getUserAndFirstGroup } from '@/lib/groups/getUserGroup'
import { CategoryIcon } from '@/components/shared/CategoryIcon'

export default async function CategoriesPage() {
  const { supabase, firstGroupId } = await getUserAndFirstGroup()

  if (!firstGroupId) {
    return (
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Categories</h1>
          <p className="text-stone-500">Organize your spending.</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-soft-md">
          <p className="mb-4 text-stone-600">Create a group to see categories.</p>
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
    .select('category, amount')
    .eq('group_id', firstGroupId)
    .eq('period_key', periodKey)

  const totals = new Map<string, number>()
  ;(expenses || []).forEach((expense) => {
    const name = expense.category || 'Uncategorized'
    const current = totals.get(name) || 0
    totals.set(name, current + Number(expense.amount || 0))
  })

  const categories = Array.from(totals.entries()).map(([name, spent]) => ({
    id: name,
    name,
    spent,
  }))

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Categories</h1>
          <p className="text-stone-500">Organize your spending.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-[#8B9D83] px-5 py-2 text-sm font-medium text-white shadow-soft-md hover:bg-[#7a8f73]">
          <span className="text-lg">+</span>
          Add Category
        </button>
      </div>

      {categories.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-soft-md"
            >
              <CategoryIcon category={category.name} />
              <div>
                <p className="text-lg font-semibold text-stone-900">{category.name}</p>
                <p className="text-sm text-stone-500">
                  ${category.spent.toFixed(2)} spent this period
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-stone-200 bg-white p-10 text-center shadow-soft-md">
          <p className="text-stone-600">No category data yet.</p>
        </div>
      )}
    </main>
  )
}
