import Link from 'next/link'
import { getUserAndFirstGroup } from '@/lib/groups/getUserGroup'

const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const formatDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export default async function CalendarPage() {
  const { supabase, firstGroupId } = await getUserAndFirstGroup()

  if (!firstGroupId) {
    return (
      <main className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Calendar</h1>
          <p className="text-stone-500">View your daily spending habits.</p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-soft-md">
          <p className="mb-4 text-stone-600">Create a group to view the calendar.</p>
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
  const year = now.getFullYear()
  const month = now.getMonth()
  const periodKey = `${year}-${String(month + 1).padStart(2, '0')}`

  const { data: expenses } = await supabase
    .from('expenses')
    .select('date, amount')
    .eq('group_id', firstGroupId)
    .eq('period_key', periodKey)

  const totals = new Map<string, number>()
  ;(expenses || []).forEach((expense) => {
    const key = expense.date
    const current = totals.get(key) || 0
    totals.set(key, current + Number(expense.amount || 0))
  })

  const firstDay = new Date(year, month, 1)
  const firstWeekday = firstDay.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayIndex = index - firstWeekday + 1
    if (dayIndex < 1 || dayIndex > daysInMonth) {
      return null
    }
    const date = new Date(year, month, dayIndex)
    const key = formatDateKey(date)
    const total = totals.get(key) || 0
    return { day: dayIndex, total }
  })

  return (
    <main className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Calendar</h1>
          <p className="text-stone-500">View your daily spending habits.</p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-2 shadow-soft-sm">
          <button className="text-stone-400">{'<'}</button>
          <span className="text-sm font-medium text-stone-700">
            {now.toLocaleString('en-US', { month: 'long' })} {year}
          </span>
          <button className="text-stone-400">{'>'}</button>
        </div>
      </div>

      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft-md">
        <div className="grid grid-cols-7 gap-2 text-xs font-semibold uppercase text-stone-400">
          {daysOfWeek.map((day) => (
            <div key={day} className="text-center">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-7 gap-3">
          {cells.map((cell, index) =>
            cell ? (
              <div
                key={index}
                className={`min-h-[90px] rounded-2xl border border-stone-100 p-3 text-sm ${
                  cell.total > 0 ? 'bg-sage-100 text-stone-700' : 'bg-white text-stone-400'
                }`}
              >
                <div className="font-medium">{cell.day}</div>
                {cell.total > 0 && (
                  <div className="mt-6 text-sm font-semibold text-stone-600">
                    ${cell.total.toFixed(0)}
                  </div>
                )}
              </div>
            ) : (
              <div key={index} />
            )
          )}
        </div>
      </div>
    </main>
  )
}
