'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type GroupType = 'couple' | 'family' | 'roommates' | 'trip'

export default function CreateGroupForm() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [type, setType] = useState<GroupType>('couple')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      // Create group
      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name,
          type,
          created_by: user.id,
        })
        .select()
        .single()

      if (groupError) {
        setError(groupError.message)
        setLoading(false)
        return
      }

      // Add creator as admin member
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin',
        })

      if (memberError) {
        setError(memberError.message)
        setLoading(false)
        return
      }

      // Redirect to budget setup
      router.push(`/groups/${group.id}/budget`)
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
            htmlFor="name"
            className="block text-sm font-medium text-stone-700"
          >
            Group Name
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
            placeholder="e.g., Home, Trip to NYC"
          />
        </div>

        <div>
          <label
            htmlFor="type"
            className="block text-sm font-medium text-stone-700"
          >
            Group Type
          </label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value as GroupType)}
            className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
          >
            <option value="couple">Couple</option>
            <option value="family">Family</option>
            <option value="roommates">Roommates</option>
            <option value="trip">Trip</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#1f6f5b] px-4 py-2.5 font-medium text-white shadow-soft-sm transition hover:bg-[#195a4a] focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Continue'}
        </button>
      </form>
    </div>
  )
}