'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function BulkConfirmDrafts({
  draftIds,
}: {
  draftIds: string[]
}) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleConfirmAll = async () => {
    if (draftIds.length === 0 || loading) return
    const confirmed = window.confirm(
      `Confirm ${draftIds.length} drafts? This will create expenses.`
    )
    if (!confirmed) return

    setLoading(true)
    setMessage(null)
    try {
      const supabase = createClient()
      for (const draftId of draftIds) {
        const { error } = await supabase.rpc('confirm_expense_draft', {
          draft_id: draftId,
        })
        if (error) {
          setMessage(error.message)
          setLoading(false)
          return
        }
      }
      setMessage(`Confirmed ${draftIds.length} drafts.`)
      window.location.reload()
    } catch (err) {
      setMessage('Unable to confirm drafts.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-soft-sm">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-stone-700">Bulk confirm</p>
          <p className="text-xs text-stone-500">
            Auto-categorized imports stay as drafts until you confirm.
          </p>
        </div>
        <button
          type="button"
          onClick={handleConfirmAll}
          disabled={loading || draftIds.length === 0}
          className="inline-flex items-center justify-center rounded-lg bg-[#1f6f5b] px-4 py-2 text-sm font-medium text-white shadow-soft-sm transition hover:bg-[#195a4a] disabled:opacity-50"
        >
          {loading ? 'Confirming...' : `Confirm ${draftIds.length} drafts`}
        </button>
      </div>
      {message ? (
        <div className="mt-3 rounded-md bg-stone-50 p-2 text-xs text-stone-600">
          {message}
        </div>
      ) : null}
    </div>
  )
}
