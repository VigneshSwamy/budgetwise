'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function DraftActions({ draftId }: { draftId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'confirm' | 'cancel' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading('confirm')
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('confirm_expense_draft', {
        draft_id: draftId,
      })

      if (error) {
        setError(error.message)
        setLoading(null)
        return
      }

      router.refresh()
    } catch (err) {
      setError('Failed to confirm draft')
      setLoading(null)
    }
  }

  const handleCancel = async () => {
    setLoading('cancel')
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('expense_drafts')
        .update({ status: 'cancelled' })
        .eq('id', draftId)

      if (error) {
        setError(error.message)
        setLoading(null)
        return
      }

      router.refresh()
    } catch (err) {
      setError('Failed to cancel draft')
      setLoading(null)
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-md bg-terracotta-50 p-2 text-xs text-terracotta-700">
          {error}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          disabled={loading !== null}
          className="rounded-md bg-[#1f6f5b] px-3 py-1.5 text-sm font-medium text-white shadow-soft-sm hover:bg-[#195a4a] disabled:opacity-50"
        >
          {loading === 'confirm' ? 'Confirming...' : 'Confirm'}
        </button>
        <button
          onClick={handleCancel}
          disabled={loading !== null}
          className="rounded-md border border-stone-200 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-white disabled:opacity-50"
        >
          {loading === 'cancel' ? 'Cancelling...' : 'Cancel'}
        </button>
      </div>
    </div>
  )
}
