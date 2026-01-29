'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  applyMerchantRules,
  categorizeMerchant,
  type MerchantRule,
} from '@/lib/imports/merchantRules'

function getPeriodKey(dateValue: string) {
  const date = new Date(dateValue)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function ExpenseDraftForm({ groupId }: { groupId: string }) {
  const router = useRouter()
  const [amount, setAmount] = useState('')
  const [merchant, setMerchant] = useState('')
  const [date, setDate] = useState(() => {
    const now = new Date()
    return now.toISOString().split('T')[0]
  })
  const [budgetImpact, setBudgetImpact] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<
    { user_id: string; display_name: string | null }[]
  >([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [paidById, setPaidById] = useState<string>('')
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([])
  const [splitMode, setSplitMode] = useState<
    'equal' | 'amount' | 'percent' | 'shares' | 'adjustment'
  >('equal')
  const [exactAmounts, setExactAmounts] = useState<Record<string, string>>({})
  const [percentSplits, setPercentSplits] = useState<Record<string, string>>({})
  const [shareSplits, setShareSplits] = useState<Record<string, string>>({})
  const [adjustmentSplits, setAdjustmentSplits] = useState<Record<string, string>>({})
  const [merchantRules, setMerchantRules] = useState<MerchantRule[]>([])

  const parsedAmount = useMemo(() => parseFloat(amount), [amount])

  useEffect(() => {
    const loadMembers = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        return
      }

      setCurrentUserId(user.id)
      setPaidById(user.id)

      const { data: memberRows } = await supabase.rpc('get_group_members', {
        group_id: groupId,
      })

      const rows = memberRows || []
      setMembers(rows)
      setSelectedMemberIds(rows.map((member: { user_id: string }) => member.user_id))
      const seedMap: Record<string, string> = {}
      rows.forEach((member: { user_id: string }) => {
        seedMap[member.user_id] = ''
      })
      setExactAmounts(seedMap)
      setPercentSplits(seedMap)
      setShareSplits(seedMap)
      setAdjustmentSplits(seedMap)
    }

    loadMembers()
  }, [groupId])

  useEffect(() => {
    if (members.length === 0) return
    if (!paidById || !members.find((m) => m.user_id === paidById)) {
      setPaidById(members[0].user_id)
    }
  }, [members, paidById])

  useEffect(() => {
    if (!paidById) return
    if (!selectedMemberIds.includes(paidById)) {
      setSelectedMemberIds((prev) => [...prev, paidById])
    }
  }, [paidById, selectedMemberIds])

  useEffect(() => {
    const loadRules = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('merchant_rules')
        .select('match_text, category, is_regex')
        .eq('user_id', user.id)
      setMerchantRules(data || [])
    }

    loadRules()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        setError('Please enter a valid amount')
        setLoading(false)
        return
      }

      if (members.length === 0 || !currentUserId) {
        setError('Add at least one group member to split the expense.')
        setLoading(false)
        return
      }

      if (selectedMemberIds.length === 0) {
        setError('Select at least one person to split with.')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const periodKey = getPeriodKey(date)
      const selectedMembers = members.filter((member) =>
        selectedMemberIds.includes(member.user_id)
      )
      const payerId = selectedMemberIds.includes(paidById)
        ? paidById
        : selectedMembers[0]?.user_id || currentUserId

      let participants: { user_id: string; paid_amount: number; owed_amount: number }[] = []
      const amountValue = parsedAmount

      if (splitMode === 'equal') {
        const split = amountValue / selectedMembers.length
        participants = selectedMembers.map((member) => ({
          user_id: member.user_id,
          paid_amount: member.user_id === payerId ? amountValue : 0,
          owed_amount: split,
        }))
      }

      if (splitMode === 'amount') {
        const totals = selectedMembers.reduce((sum, member) => {
          const value = parseFloat(exactAmounts[member.user_id] || '0')
          return sum + (Number.isNaN(value) ? 0 : value)
        }, 0)
        if (Math.abs(totals - amountValue) > 0.01) {
          setError('Exact amounts must add up to the total.')
          setLoading(false)
          return
        }
        participants = selectedMembers.map((member) => ({
          user_id: member.user_id,
          paid_amount: member.user_id === payerId ? amountValue : 0,
          owed_amount: parseFloat(exactAmounts[member.user_id] || '0') || 0,
        }))
      }

      if (splitMode === 'percent') {
        const totals = selectedMembers.reduce((sum, member) => {
          const value = parseFloat(percentSplits[member.user_id] || '0')
          return sum + (Number.isNaN(value) ? 0 : value)
        }, 0)
        if (Math.abs(totals - 100) > 0.01) {
          setError('Percentages must add up to 100%.')
          setLoading(false)
          return
        }
        participants = selectedMembers.map((member) => ({
          user_id: member.user_id,
          paid_amount: member.user_id === payerId ? amountValue : 0,
          owed_amount: (amountValue * (parseFloat(percentSplits[member.user_id] || '0') || 0)) / 100,
        }))
      }

      if (splitMode === 'shares') {
        const totalShares = selectedMembers.reduce((sum, member) => {
          const value = parseFloat(shareSplits[member.user_id] || '0')
          return sum + (Number.isNaN(value) ? 0 : value)
        }, 0)
        if (!totalShares || totalShares <= 0) {
          setError('Add at least one share.')
          setLoading(false)
          return
        }
        participants = selectedMembers.map((member) => ({
          user_id: member.user_id,
          paid_amount: member.user_id === payerId ? amountValue : 0,
          owed_amount:
            (amountValue * (parseFloat(shareSplits[member.user_id] || '0') || 0)) /
            totalShares,
        }))
      }

      if (splitMode === 'adjustment') {
        const base = amountValue / selectedMembers.length
        const totals = selectedMembers.reduce((sum, member) => {
          const adj = parseFloat(adjustmentSplits[member.user_id] || '0')
          return sum + (Number.isNaN(adj) ? 0 : adj)
        }, 0)
        if (Math.abs(totals) > 0.01) {
          setError('Adjustments must balance to $0.00.')
          setLoading(false)
          return
        }
        participants = selectedMembers.map((member) => {
          const adj = parseFloat(adjustmentSplits[member.user_id] || '0') || 0
          const owed = base + adj
          return {
            user_id: member.user_id,
            paid_amount: member.user_id === payerId ? amountValue : 0,
            owed_amount: owed,
          }
        })
      }

      const trimmedMerchant = merchant.trim()
      const ruleCategory = trimmedMerchant
        ? applyMerchantRules(trimmedMerchant, merchantRules)
        : null
      const inferredCategory = trimmedMerchant
        ? ruleCategory || categorizeMerchant(trimmedMerchant)
        : null
      const categorySource = ruleCategory ? 'rule' : 'user'

      const { data: draftRow, error: draftError } = await supabase
        .from('expense_drafts')
        .insert({
          group_id: groupId,
          created_by: user.id,
          amount: parsedAmount,
          merchant: trimmedMerchant || null,
          date,
          period_key: periodKey,
          budget_impact: budgetImpact,
          category: inferredCategory,
          category_source: inferredCategory ? categorySource : 'user',
          participants,
          source: 'manual',
          status: 'draft',
        })
        .select('id')
        .single()

      if (draftError || !draftRow?.id) {
        setError(draftError?.message || 'Unable to save the expense.')
        setLoading(false)
        return
      }

      const { error: confirmError } = await supabase.rpc('confirm_expense_draft', {
        draft_id: draftRow.id,
      })

      if (confirmError) {
        setError(confirmError.message)
        setLoading(false)
        return
      }

      router.push(`/groups/${groupId}/expenses`)
      router.refresh()
      return
    } catch (err) {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  const selectedMembers = members.filter((member) =>
    selectedMemberIds.includes(member.user_id)
  )
  const perPersonAmount =
    parsedAmount && selectedMembers.length
      ? (parsedAmount / selectedMembers.length).toFixed(2)
      : '0.00'

  const totalShares = selectedMembers.reduce((sum, member) => {
    const value = parseFloat(shareSplits[member.user_id] || '0')
    return sum + (Number.isNaN(value) ? 0 : value)
  }, 0)

  const totalPercent = selectedMembers.reduce((sum, member) => {
    const value = parseFloat(percentSplits[member.user_id] || '0')
    return sum + (Number.isNaN(value) ? 0 : value)
  }, 0)

  const getAutoTargetId = (currentId: string) => {
    const candidates = selectedMemberIds.filter((id) => id !== currentId)
    return candidates[candidates.length - 1] || ''
  }

  const updateExactAmount = (memberId: string, value: string) => {
    setExactAmounts((prev) => {
      const next = { ...prev, [memberId]: value }
      const targetId = getAutoTargetId(memberId)
      if (!targetId || !parsedAmount || selectedMemberIds.length < 2) {
        return next
      }
      const sumOthers = selectedMemberIds.reduce((sum, id) => {
        if (id === targetId) return sum
        const val = parseFloat(next[id] || '0')
        return sum + (Number.isNaN(val) ? 0 : val)
      }, 0)
      const remaining = parsedAmount - sumOthers
      next[targetId] = Number.isFinite(remaining) ? remaining.toFixed(2) : ''
      return next
    })
  }

  const updatePercentSplit = (memberId: string, value: string) => {
    setPercentSplits((prev) => {
      const next = { ...prev, [memberId]: value }
      const targetId = getAutoTargetId(memberId)
      if (!targetId || selectedMemberIds.length < 2) {
        return next
      }
      const sumOthers = selectedMemberIds.reduce((sum, id) => {
        if (id === targetId) return sum
        const val = parseFloat(next[id] || '0')
        return sum + (Number.isNaN(val) ? 0 : val)
      }, 0)
      const remaining = 100 - sumOthers
      next[targetId] = Number.isFinite(remaining) ? remaining.toFixed(0) : ''
      return next
    })
  }

  const updateAdjustmentSplit = (memberId: string, value: string) => {
    setAdjustmentSplits((prev) => {
      const next = { ...prev, [memberId]: value }
      const targetId = getAutoTargetId(memberId)
      if (!targetId || selectedMemberIds.length < 2) {
        return next
      }
      const sumOthers = selectedMemberIds.reduce((sum, id) => {
        if (id === targetId) return sum
        const val = parseFloat(next[id] || '0')
        return sum + (Number.isNaN(val) ? 0 : val)
      }, 0)
      const remaining = -sumOthers
      next[targetId] = Number.isFinite(remaining) ? remaining.toFixed(2) : ''
      return next
    })
  }

  const toggleMember = (memberId: string) => {
    setSelectedMemberIds((prev) => {
      const isSelected = prev.includes(memberId)
      if (!isSelected) {
        return [...prev, memberId]
      }
      if (prev.length <= 1) {
        return prev
      }
      const next = prev.filter((id) => id !== memberId)
      if (memberId === paidById) {
        setPaidById(next[0] || '')
      }
      return next
    })
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    const parts = name.trim().split(' ').filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
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
          <label htmlFor="amount" className="block text-sm font-medium text-stone-700">
            Amount
          </label>
          <div className="mt-1 flex rounded-lg shadow-soft-sm">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-stone-200 bg-stone-50 px-3 text-stone-500">
              $
            </span>
            <input
              id="amount"
              type="number"
              required
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full flex-1 rounded-none rounded-r-lg border border-stone-200 px-3 py-2.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
              placeholder="45.20"
            />
          </div>
        </div>

        <div>
          <label htmlFor="merchant" className="block text-sm font-medium text-stone-700">
            Merchant (optional)
          </label>
          <input
            id="merchant"
            type="text"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
            placeholder="e.g., Target"
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-stone-700">
            Date
          </label>
          <input
            id="date"
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
          />
        </div>

        <div className="rounded-xl border border-stone-200 bg-stone-50">
          <div className="border-b border-stone-200 px-4 py-3">
            <p className="text-sm font-semibold text-stone-700">Split options</p>
            <p className="text-xs text-stone-500">
              Split equally and choose who owes a share.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-stone-200 px-4 py-3">
            {[
              { id: 'equal', label: '=', color: 'bg-emerald-500 text-white' },
              { id: 'amount', label: '1.23', color: 'bg-amber-500 text-white' },
              { id: 'percent', label: '%', color: 'bg-sky-500 text-white' },
              { id: 'shares', label: '≡', color: 'bg-violet-500 text-white' },
              { id: 'adjustment', label: '+/-', color: 'bg-rose-500 text-white' },
            ].map((mode) => {
              const isActive = splitMode === mode.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setSplitMode(mode.id as typeof splitMode)}
                  className={`flex h-10 min-w-[52px] items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${
                    isActive
                      ? `${mode.color} border-transparent`
                      : 'border-stone-200 bg-white text-stone-500 hover:bg-stone-100'
                  }`}
                >
                  {mode.label}
                </button>
              )
            })}
          </div>
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-sm font-semibold text-stone-500 shadow-soft-sm">
                {getInitials(
                  members.find((member) => member.user_id === (paidById || currentUserId))
                    ?.display_name || 'You'
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-stone-700">Paid by</p>
                <select
                  id="paidBy"
                  value={paidById || currentUserId || ''}
                  onChange={(e) => setPaidById(e.target.value)}
                  className="mt-1 rounded-md border border-stone-200 bg-white px-2 py-1 text-sm text-stone-700 shadow-soft-sm"
                >
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.display_name || `Member ${member.user_id.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="text-right text-xs text-stone-500">
              {splitMode === 'equal' ? (
                <>
                  <p className="font-medium text-stone-700">${perPersonAmount}/person</p>
                  <p>{selectedMembers.length} people</p>
                </>
              ) : null}
              {splitMode === 'shares' ? (
                <>
                  <p className="font-medium text-stone-700">{totalShares || 0} total shares</p>
                  <p>{selectedMembers.length} people</p>
                </>
              ) : null}
              {splitMode === 'percent' ? (
                <>
                  <p className="font-medium text-stone-700">{totalPercent.toFixed(0)}% of 100%</p>
                  <p>{Math.max(0, 100 - totalPercent).toFixed(0)}% left</p>
                </>
              ) : null}
            </div>
          </div>
          <div className="border-t border-stone-200 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">
              {splitMode === 'equal' && 'Split equally'}
              {splitMode === 'amount' && 'Split by exact amounts'}
              {splitMode === 'percent' && 'Split by percentages'}
              {splitMode === 'shares' && 'Split by shares'}
              {splitMode === 'adjustment' && 'Split by adjustment'}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              {splitMode === 'equal' && 'Select which people owe an equal share.'}
              {splitMode === 'amount' && 'Specify exactly how much each person owes.'}
              {splitMode === 'percent' && 'Enter the percentage split for each person.'}
              {splitMode === 'shares' && 'Give each person a number of shares.'}
              {splitMode === 'adjustment' &&
                'Add adjustments; the remainder is split equally.'}
            </p>
            <div className="mt-3 space-y-2">
              {members.map((member) => {
                const isSelected = selectedMemberIds.includes(member.user_id)
                return (
                  <button
                    key={member.user_id}
                    type="button"
                    onClick={() => toggleMember(member.user_id)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                      isSelected
                        ? 'border-sage-200 bg-white shadow-soft-sm'
                        : 'border-stone-200 bg-white/70 text-stone-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-500">
                        {getInitials(member.display_name)}
                      </div>
                      <span className="text-sm font-medium text-stone-700">
                        {member.display_name || `Member ${member.user_id.slice(0, 6)}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {splitMode === 'amount' ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={exactAmounts[member.user_id] || ''}
                          onChange={(e) =>
                            updateExactAmount(member.user_id, e.target.value)
                          }
                          placeholder="$0.00"
                          className="w-24 rounded-md border border-stone-200 bg-white px-2 py-1 text-sm text-stone-700"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : null}
                      {splitMode === 'percent' ? (
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          value={percentSplits[member.user_id] || ''}
                          onChange={(e) =>
                            updatePercentSplit(member.user_id, e.target.value)
                          }
                          placeholder="0%"
                          className="w-20 rounded-md border border-stone-200 bg-white px-2 py-1 text-sm text-stone-700"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : null}
                      {splitMode === 'shares' ? (
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={shareSplits[member.user_id] || ''}
                          onChange={(e) =>
                            setShareSplits((prev) => ({
                              ...prev,
                              [member.user_id]: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="w-20 rounded-md border border-stone-200 bg-white px-2 py-1 text-sm text-stone-700"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : null}
                      {splitMode === 'adjustment' ? (
                        <input
                          type="number"
                          step="0.01"
                          value={adjustmentSplits[member.user_id] || ''}
                          onChange={(e) =>
                            updateAdjustmentSplit(member.user_id, e.target.value)
                          }
                          placeholder="+0.00"
                          className="w-24 rounded-md border border-stone-200 bg-white px-2 py-1 text-sm text-stone-700"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : null}
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs ${
                          isSelected
                            ? 'border-sage-300 bg-sage-100 text-sage-700'
                            : 'border-stone-200 text-stone-400'
                        }`}
                      >
                        ✓
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2">
          <input
            id="budgetImpact"
            type="checkbox"
            checked={budgetImpact}
            onChange={(e) => setBudgetImpact(e.target.checked)}
            className="h-4 w-4 rounded border-stone-300 text-sage-600 focus:ring-sage-500"
          />
          <label htmlFor="budgetImpact" className="text-sm text-stone-700">
            Count this expense against the budget
          </label>
        </div>

        <p className="text-xs text-stone-500">
          We’ll split equally across selected people and auto‑categorize based on the merchant.
        </p>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#1f6f5b] px-4 py-2.5 font-medium text-white shadow-soft-sm transition hover:bg-[#195a4a] focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Saving expense...' : 'Save expense'}
        </button>
      </form>
    </div>
  )
}
