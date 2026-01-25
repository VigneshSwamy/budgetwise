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
  const [category, setCategory] = useState('')
  const [notes, setNotes] = useState('')
  const [receiptUrl, setReceiptUrl] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptParsing, setReceiptParsing] = useState(false)
  const [receiptMessage, setReceiptMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [members, setMembers] = useState<
    { user_id: string; display_name: string | null }[]
  >([])
  const [participants, setParticipants] = useState<
    { user_id: string; paid_amount: number; owed_amount: number }[]
  >([])
  const [autoSplit, setAutoSplit] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
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

      const { data: memberRows } = await supabase.rpc('get_group_members', {
        group_id: groupId,
      })

      const rows = memberRows || []
      setMembers(rows)

      const initialParticipants = rows.map(
        (member: { user_id: string }) => ({
          user_id: member.user_id,
          paid_amount: 0,
          owed_amount: 0,
        })
      )

      setParticipants(initialParticipants)
    }

    loadMembers()
  }, [groupId])

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

  useEffect(() => {
    if (!autoSplit || members.length === 0) {
      return
    }

    const amountValue = isNaN(parsedAmount) ? 0 : parsedAmount
    const split = members.length > 0 ? amountValue / members.length : 0

    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        owed_amount: split,
        paid_amount: p.user_id === currentUserId ? amountValue : p.paid_amount,
      }))
    )
  }, [parsedAmount, members.length, autoSplit, currentUserId])

  const updateParticipant = (
    userId: string,
    field: 'paid_amount' | 'owed_amount',
    value: number
  ) => {
    setParticipants((prev) =>
      prev.map((p) =>
        p.user_id === userId ? { ...p, [field]: value } : p
      )
    )
  }

  const handleSplitEqually = () => {
    if (members.length === 0) return
    const amountValue = isNaN(parsedAmount) ? 0 : parsedAmount
    const split = members.length > 0 ? amountValue / members.length : 0
    setAutoSplit(true)
    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        owed_amount: split,
      }))
    )
  }

  const handlePaidByMe = () => {
    if (!currentUserId) return
    const amountValue = isNaN(parsedAmount) ? 0 : parsedAmount
    setParticipants((prev) =>
      prev.map((p) => ({
        ...p,
        paid_amount: p.user_id === currentUserId ? amountValue : 0,
      }))
    )
  }

  const handleReceiptChange = async (file: File | null) => {
    setReceiptFile(file)
    setReceiptMessage(null)
    if (!file) return

    setReceiptParsing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const response = await fetch('/api/parse-receipt', {
        method: 'POST',
        body: formData,
      })
      const result = await response.json()
      if (!response.ok) {
        setReceiptMessage(result?.error || 'Unable to parse receipt.')
        setReceiptParsing(false)
        return
      }

      const receipt = result?.receipt
      if (receipt?.amount) {
        setAmount(String(receipt.amount))
      }
      if (receipt?.merchant) {
        setMerchant(receipt.merchant)
        const ruleCategory = applyMerchantRules(receipt.merchant, merchantRules)
        setCategory(ruleCategory || categorizeMerchant(receipt.merchant))
      }
      if (receipt?.date) {
        setDate(receipt.date)
      }

      setReceiptMessage('Receipt parsed. Review and save as a draft.')
    } catch (err) {
      setReceiptMessage('Unable to parse receipt.')
    } finally {
      setReceiptParsing(false)
    }
  }

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

      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const periodKey = getPeriodKey(date)

      let uploadedReceiptPath: string | null = receiptUrl || null

      if (receiptFile) {
        const fileExt = receiptFile.name.split('.').pop() || 'pdf'
        const filePath = `${groupId}/${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(filePath, receiptFile, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          setError(
            uploadError.message ||
              'Receipt upload failed. You can save without a receipt.'
          )
          setLoading(false)
          return
        }

        const { error: uploadRowError } = await supabase.from('uploads').insert({
          user_id: user.id,
          group_id: groupId,
          file_url: filePath,
          mime_type: receiptFile.type || null,
          file_name: receiptFile.name,
          file_size: receiptFile.size,
          status: 'pending',
        })

        if (uploadRowError) {
          setError(uploadRowError.message)
          setLoading(false)
          return
        }

        uploadedReceiptPath = filePath
      }

      const paidTotal = participants.reduce(
        (sum, p) => sum + (Number.isNaN(p.paid_amount) ? 0 : p.paid_amount),
        0
      )
      const owedTotal = participants.reduce(
        (sum, p) => sum + (Number.isNaN(p.owed_amount) ? 0 : p.owed_amount),
        0
      )

      if (Math.abs(paidTotal - parsedAmount) > 0.01) {
        setError('Paid total must equal the expense amount.')
        setLoading(false)
        return
      }

      if (Math.abs(owedTotal - parsedAmount) > 0.01) {
        setError('Owed total must equal the expense amount.')
        setLoading(false)
        return
      }

      const { error: draftError } = await supabase.from('expense_drafts').insert({
        group_id: groupId,
        created_by: user.id,
        amount: parsedAmount,
        merchant: merchant || null,
        date,
        period_key: periodKey,
        budget_impact: budgetImpact,
        category: category || null,
        category_source: 'user',
        participants,
        source: 'manual',
        status: 'draft',
        notes: notes || null,
        receipt_url: uploadedReceiptPath,
      })

      if (draftError) {
        setError(draftError.message)
        setLoading(false)
        return
      }

      router.push(`/groups/${groupId}/expenses/drafts`)
      router.refresh()
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

        <div>
          <label htmlFor="category" className="block text-sm font-medium text-stone-700">
            Category (optional)
          </label>
          <input
            id="category"
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
            placeholder="e.g., Groceries"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-stone-700">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700">
            Receipt (optional)
          </label>
          <div className="mt-2 space-y-3">
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={(e) => handleReceiptChange(e.target.files?.[0] || null)}
              className="block w-full text-sm text-stone-600 file:mr-4 file:rounded-md file:border-0 file:bg-stone-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-stone-700 hover:file:bg-stone-200"
            />
            <input
              type="url"
              value={receiptUrl}
              onChange={(e) => setReceiptUrl(e.target.value)}
              placeholder="Or paste a receipt URL"
              className="block w-full rounded-lg border border-stone-200 px-3 py-2.5 text-sm shadow-soft-sm focus:border-sage-500 focus:outline-none focus:ring-2 focus:ring-sage-200"
            />
          </div>
          {receiptMessage ? (
            <p className="mt-2 text-xs text-stone-600">{receiptMessage}</p>
          ) : null}
          {receiptParsing ? (
            <p className="mt-1 text-xs text-stone-500">Parsing receipt...</p>
          ) : null}
          <p className="mt-2 text-xs text-stone-500">
            If you upload a file, it will be saved to Supabase Storage.
          </p>
        </div>

        <div className="space-y-4 rounded-xl border border-stone-200 bg-stone-50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-stone-700">Participants</p>
              <p className="text-xs text-stone-500">
                Split the expense across group members.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handlePaidByMe}
                className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
              >
                Paid by me
              </button>
              <button
                type="button"
                onClick={handleSplitEqually}
                className="rounded-md border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-100"
              >
                Split equally
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {members.map((member) => {
              const participant = participants.find(
                (p) => p.user_id === member.user_id
              )
              return (
                <div
                  key={member.user_id}
                  className="grid grid-cols-1 gap-3 rounded-lg border border-stone-200 bg-white p-3 sm:grid-cols-3 sm:items-center"
                >
                  <div className="text-sm font-medium text-stone-700">
                    {member.display_name || `Member ${member.user_id.slice(0, 6)}`}
                  </div>
                  <div>
                    <label className="text-xs text-stone-500">Paid</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={participant?.paid_amount ?? 0}
                      onChange={(e) =>
                        updateParticipant(
                          member.user_id,
                          'paid_amount',
                          parseFloat(e.target.value || '0')
                        )
                      }
                      className="mt-1 w-full rounded-md border border-stone-200 px-2 py-1.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-500">Owes</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={participant?.owed_amount ?? 0}
                      onChange={(e) =>
                        updateParticipant(
                          member.user_id,
                          'owed_amount',
                          parseFloat(e.target.value || '0')
                        )
                      }
                      className="mt-1 w-full rounded-md border border-stone-200 px-2 py-1.5 text-sm focus:border-sage-500 focus:outline-none focus:ring-1 focus:ring-sage-200"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>
              Paid total: $
              {participants
                .reduce((sum, p) => sum + (p.paid_amount || 0), 0)
                .toFixed(2)}
            </span>
            <span>
              Owed total: $
              {participants
                .reduce((sum, p) => sum + (p.owed_amount || 0), 0)
                .toFixed(2)}
            </span>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-[#1f6f5b] px-4 py-2.5 font-medium text-white shadow-soft-sm transition hover:bg-[#195a4a] focus:outline-none focus:ring-2 focus:ring-sage-600 focus:ring-offset-2 disabled:opacity-50"
        >
          {loading ? 'Saving draft...' : 'Save draft'}
        </button>
      </form>
    </div>
  )
}
