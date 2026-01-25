'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function SetBudgetForm({ groupId }: { groupId: string }) {
  const router = useRouter()
  const [budgetAmount, setBudgetAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const amount = parseFloat(budgetAmount)
      if (isNaN(amount) || amount <= 0) {
        setError('Please enter a valid budget amount')
        setLoading(false)
        return
      }

      const supabase = createClient()

      // Get current month period key (YYYY-MM format)
      const now = new Date()
      const periodKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

      // Calculate start and end dates for the month
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      // Create or update budget period
      const { error: budgetError } = await supabase
        .from('budget_periods')
        .upsert(
          {
            group_id: groupId,
            period_key: periodKey,
            budget_amount: amount,
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
          },
          {
            onConflict: 'group_id,period_key',
          }
        )

      if (budgetError) {
        setError(budgetError.message)
        setLoading(false)
        return
      }

      // Redirect to dashboard
      router.push('/dashboard')
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-soft-lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-md bg-terracotta-50 p-3 text-sm text-terracotta-700">
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="budget"
            className="block text-sm font-medium text-stone-700"
          >
            Monthly Budget Amount
          </label>
          <div className="mt-1 flex rounded-lg shadow-soft-sm">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-stone-200 bg-stone-50 px-3 text-stone-500">
              $
            </span>
            <input
              id="budget"
              type="number"
              required
              min="0"
              step="0.01"
              value={budgetAmount}
              onChange={(e) => setBudgetAmount(e.target.value)}
              className="block w-full flex-1 rounded-none rounded-r-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
              placeholder="1000"
            />
          </div>
          <p className="mt-1 text-xs text-stone-500">
            This is a virtual wallet. Your actual bank account is never
            connected.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#1f6f5b] px-4 py-2.5 font-medium text-white shadow-soft-sm transition hover:bg-[#195a4a] focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Setting budget...' : 'Start tracking'}
        </button>
      </form>
    </div>
  )
}