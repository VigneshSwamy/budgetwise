'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function InviteMemberForm({ groupId }: { groupId: string }) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.rpc('invite_member_by_email', {
        p_group_id: groupId,
        p_email: email,
      })

      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      setMessage('Invite sent. They now have access to this group.')
      setEmail('')
    } catch (err) {
      setMessage('Failed to invite member.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleInvite} className="space-y-3">
      {message ? (
        <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-600">
          {message}
        </div>
      ) : null}

      <div>
        <label className="block text-sm font-medium text-stone-700">
          Invite by email
        </label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="w-full rounded-lg border border-stone-200 px-3 py-2 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-[#1f6f5b] px-4 py-2 text-sm font-medium text-white shadow-soft-sm hover:bg-[#195a4a] disabled:opacity-50"
          >
            {loading ? 'Inviting...' : 'Invite'}
          </button>
        </div>
      </div>
      <p className="text-xs text-stone-500">
        The email must already have a BudgetWise account.
      </p>
    </form>
  )
}
