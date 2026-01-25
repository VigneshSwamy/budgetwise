'use client'

import { useTransition } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { deleteGroup, setActiveGroup } from '@/lib/groups/actions'

type GroupOption = {
  id: string
  name: string
}

export default function GroupSwitcher({
  groups,
  activeGroupId,
}: {
  groups: GroupOption[]
  activeGroupId?: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  if (groups.length === 0) {
    return null
  }

  const selectedGroupId = activeGroupId || groups[0]?.id

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextGroupId = event.target.value
    startTransition(async () => {
      await setActiveGroup(nextGroupId)
      const nextPath = pathname?.includes('/groups/')
        ? pathname.replace(/\/groups\/[^/]+/, `/groups/${nextGroupId}`)
        : `/groups/${nextGroupId}/expenses`
      router.push(nextPath)
      router.refresh()
    })
  }

  const handleDelete = () => {
    if (!selectedGroupId) return

    const confirmed = window.confirm(
      'Delete this group? This will permanently remove budgets, expenses, and members.'
    )

    if (!confirmed) {
      return
    }

    startTransition(async () => {
      try {
        await deleteGroup(selectedGroupId)
        router.push('/dashboard')
        router.refresh()
      } catch (err) {
        window.alert('Unable to delete group. You must be the group owner.')
      }
    })
  }

  return (
    <div className="mb-6">
      <label
        htmlFor="group-switcher"
        className="text-[11px] font-semibold uppercase tracking-wide text-stone-400"
      >
        Group
      </label>
      <div className="mt-2 flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 shadow-soft-sm">
        <span className="text-sm text-stone-400">🏷️</span>
        <select
          id="group-switcher"
          value={selectedGroupId}
          onChange={handleChange}
          className="w-full bg-transparent text-sm font-medium text-stone-700 outline-none"
          disabled={isPending}
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-lg p-1.5 text-terracotta-500 hover:bg-terracotta-50 hover:text-terracotta-600"
          aria-label="Delete group"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
            <path
              d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path d="M10 11v6M14 11v6" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>
      <button
        type="button"
        onClick={() => router.push('/groups/create')}
        className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-sage-700 hover:text-sage-800"
      >
        <span className="text-base">＋</span>
        Create new group
      </button>
    </div>
  )
}
