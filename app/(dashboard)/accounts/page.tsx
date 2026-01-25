import Link from 'next/link'
import { getUserAndFirstGroup } from '@/lib/groups/getUserGroup'

export default async function AccountsPage() {
  const { firstGroupId } = await getUserAndFirstGroup()

  if (!firstGroupId) {
    return (
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Accounts</h1>
          <p className="text-stone-500">Track balances across accounts.</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-soft-md">
          <p className="mb-4 text-stone-600">Create a group to manage accounts.</p>
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
          <h1 className="text-2xl font-bold text-stone-900">Accounts</h1>
          <p className="text-stone-500">Track your balances across accounts.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-full bg-[#8B9D83] px-5 py-2 text-sm font-medium text-white shadow-soft-md hover:bg-[#7a8f73]">
          <span className="text-lg">+</span>
          Add Account
        </button>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-8 shadow-soft-md">
        <p className="text-sm text-stone-500">Net Worth</p>
        <div className="mt-6 rounded-2xl border border-stone-100 bg-stone-50 p-6 text-stone-400">
          No accounts connected yet.
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-soft-md">
        <p className="text-stone-600">Add your first account to see balances here.</p>
      </div>
    </main>
  )
}
