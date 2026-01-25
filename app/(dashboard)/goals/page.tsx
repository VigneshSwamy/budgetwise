import Link from 'next/link'
import { getUserAndFirstGroup } from '@/lib/groups/getUserGroup'

export default async function GoalsPage() {
  const { firstGroupId } = await getUserAndFirstGroup()

  if (!firstGroupId) {
    return (
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Savings Goals</h1>
          <p className="text-stone-500">Track your progress toward targets.</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-soft-md">
          <p className="mb-4 text-stone-600">Create a group to set goals.</p>
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

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Savings Goals</h1>
          <p className="text-stone-500">Track your progress toward financial targets.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-[#8B9D83] px-5 py-2 text-sm font-medium text-white shadow-soft-md hover:bg-[#7a8f73]">
          <span className="text-lg">+</span>
          New Goal
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft-md">
          <p className="text-sm text-stone-500">No goals yet</p>
          <p className="mt-3 text-lg font-semibold text-stone-900">Add your first goal</p>
          <p className="mt-2 text-sm text-stone-500">
            Goals will show progress once you start contributing.
          </p>
          <div className="mt-6 h-2 w-full rounded-full bg-stone-100" />
        </div>
      </div>
    </main>
  )
}
