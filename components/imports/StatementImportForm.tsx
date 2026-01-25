'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  applyMerchantRules,
  categorizeMerchant,
  normalizeMerchantKey,
  type MerchantRule,
} from '@/lib/imports/merchantRules'

type MappingState = {
  date: string
  amount: string
  merchant: string
  category: string
}

type ParsedRow = {
  raw: string[]
  mapped: {
    date: string
    amount: string
    merchant: string
    category: string
  }
}

type PreviewRow = {
  index: number
  date: string
  amount: number
  merchant: string
  category: string
  categorySource: 'rule' | 'user'
}

const categoryOptions = [
  'Groceries',
  'Dining',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Health',
  'Uncategorized',
]


const guessColumn = (headers: string[], patterns: RegExp[]) => {
  const index = headers.findIndex((header) =>
    patterns.some((pattern) => pattern.test(header.toLowerCase()))
  )
  return index >= 0 ? headers[index] : ''
}

const parseCsv = (content: string) => {
  const rows: string[][] = []
  let current = ''
  let row: string[] = []
  let inQuotes = false

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i]
    const next = content[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      row.push(current.trim())
      current = ''
      continue
    }

    if ((char === '\n' || char === '\r') && !inQuotes) {
      if (current.length || row.length) {
        row.push(current.trim())
        rows.push(row)
        row = []
        current = ''
      }
      continue
    }

    current += char
  }

  if (current.length || row.length) {
    row.push(current.trim())
    rows.push(row)
  }

  return rows.filter((line) => line.some((cell) => cell.length > 0))
}

const normalizeDate = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0]
  }

  const parts = trimmed.split(/[/-]/).map((part) => part.trim())
  if (parts.length === 3) {
    const [a, b, c] = parts.map(Number)
    if (!Number.isNaN(a) && !Number.isNaN(b) && !Number.isNaN(c)) {
      const year = c < 100 ? 2000 + c : c
      const month = a > 12 ? b : a
      const day = a > 12 ? a : b
      const fallback = new Date(year, month - 1, day)
      if (!Number.isNaN(fallback.getTime())) {
        return fallback.toISOString().split('T')[0]
      }
    }
  }

  return null
}

const normalizeAmount = (value: string) => {
  const cleaned = value.replace(/[^0-9.-]/g, '')
  const parsed = Number.parseFloat(cleaned)
  if (Number.isNaN(parsed)) return null
  return Math.abs(parsed)
}

const getPeriodKey = (dateValue: string) => {
  const date = new Date(dateValue)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function StatementImportForm({ groupId }: { groupId: string }) {
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<string[][]>([])
  const [previewPage, setPreviewPage] = useState(1)
  const pageSize = 10
  const [mapping, setMapping] = useState<MappingState>({
    date: '',
    amount: '',
    merchant: '',
    category: '',
  })
  const [budgetImpact, setBudgetImpact] = useState(true)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [merchantRules, setMerchantRules] = useState<MerchantRule[]>([])
  const [categoryOverrides, setCategoryOverrides] = useState<Record<number, string>>({})
  const [rememberRules, setRememberRules] = useState<Record<number, boolean>>({})

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
      const rules =
        data?.map((rule) => ({
          ...rule,
          match_text: normalizeMerchantKey(rule.match_text || ''),
        })) || []
      setMerchantRules(rules)
    }

    loadRules()
  }, [])

  const parsedRows = useMemo<ParsedRow[]>(() => {
    if (!headers.length) return []
    const getIndex = (key: keyof MappingState) =>
      headers.findIndex((header) => header === mapping[key])

    const dateIndex = getIndex('date')
    const amountIndex = getIndex('amount')
    const merchantIndex = getIndex('merchant')
    const categoryIndex = getIndex('category')

    return rows.map((row) => ({
      raw: row,
      mapped: {
        date: dateIndex >= 0 ? row[dateIndex] || '' : '',
        amount: amountIndex >= 0 ? row[amountIndex] || '' : '',
        merchant: merchantIndex >= 0 ? row[merchantIndex] || '' : '',
        category: categoryIndex >= 0 ? row[categoryIndex] || '' : '',
      },
    }))
  }, [headers, mapping, rows])

  const previewRows = useMemo<PreviewRow[]>(() => {
    return parsedRows
      .map((row, index) => {
        const date = normalizeDate(row.mapped.date)
        const amount = normalizeAmount(row.mapped.amount)
        const merchant = row.mapped.merchant || 'Imported transaction'
        const ruleCategory = applyMerchantRules(merchant, merchantRules)
        const autoCategory = ruleCategory || categorizeMerchant(merchant)
        const override = categoryOverrides[index]
        const category = override || row.mapped.category || autoCategory
        const categorySource: PreviewRow['categorySource'] = override
          ? 'user'
          : ruleCategory
          ? 'rule'
          : 'user'

        return {
          index,
          date: date || '',
          amount: amount || 0,
          merchant,
          category,
          categorySource,
        }
      })
      .filter((row) => row.date && row.amount)
  }, [parsedRows, merchantRules, categoryOverrides])

  useEffect(() => {
    setPreviewPage(1)
  }, [rows.length, headers.length])

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(null)
    const file = event.target.files?.[0]
    if (!file) return

    const isPdf = file.name.toLowerCase().endsWith('.pdf')
    const isImage = file.type.startsWith('image/')

    if (isImage) {
      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/parse-receipt', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()
        if (!response.ok) {
          setMessage(result?.error || 'Receipt parsing failed.')
          setLoading(false)
          return
        }

        const receipt = result?.receipt || {}
        const headerRow = ['Date', 'Amount', 'Merchant', 'Category']
        const merchantName = receipt.merchant || 'Receipt purchase'
        const dataRows = [
          [
            receipt.date || new Date().toISOString().split('T')[0],
            String(receipt.amount || ''),
            merchantName,
            categorizeMerchant(merchantName),
          ],
        ]

        setHeaders(headerRow)
        setRows(dataRows)
        setMapping({
          date: 'Date',
          amount: 'Amount',
          merchant: 'Merchant',
          category: 'Category',
        })
      } catch (err) {
        setMessage('Unable to parse the receipt.')
      } finally {
        setLoading(false)
      }
      return
    }

    if (isPdf) {
      setLoading(true)
      try {
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch('/api/parse-statement', {
          method: 'POST',
          body: formData,
        })

        const result = await response.json()
        if (!response.ok) {
          setMessage(result?.error || 'PDF parsing failed.')
          setLoading(false)
          return
        }

        const headerRow = ['Date', 'Amount', 'Merchant', 'Category']
        const dataRows = (result.rows || []).map(
          (row: { date: string; amount: number; merchant: string; category?: string }) => [
            row.date,
            String(row.amount),
            row.merchant,
            row.category || '',
          ]
        )

        setHeaders(headerRow)
        setRows(dataRows)
        setMapping({
          date: 'Date',
          amount: 'Amount',
          merchant: 'Merchant',
          category: 'Category',
        })
      } catch (err) {
        setMessage('Unable to parse the PDF statement.')
      } finally {
        setLoading(false)
      }
      return
    }

    const text = await file.text()
    const data = parseCsv(text)
    if (data.length < 2) {
      setMessage('Unable to read this CSV. Please check the format.')
      return
    }

    const headerRow = data[0].map((header, index) => header || `Column ${index + 1}`)
    const dataRows = data.slice(1)

    setHeaders(headerRow)
    setRows(dataRows)
    setMapping({
      date: guessColumn(headerRow, [/date/, /posted/, /transaction/]),
      amount: guessColumn(headerRow, [/amount/, /debit/, /credit/, /value/]),
      merchant: guessColumn(headerRow, [/merchant/, /description/, /payee/, /name/]),
      category: guessColumn(headerRow, [/category/, /type/]),
    })
  }

  const handleImport = async () => {
    setLoading(true)
    setMessage(null)

    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage('Please sign in again.')
        setLoading(false)
        return
      }

      if (!mapping.date || !mapping.amount) {
        setMessage('Please map the date and amount columns.')
        setLoading(false)
        return
      }

      const drafts = previewRows.map((row) => ({
        group_id: groupId,
        created_by: user.id,
        amount: row.amount,
        merchant: row.merchant || null,
        date: row.date,
        period_key: getPeriodKey(row.date),
        budget_impact: budgetImpact,
        category: row.category,
        category_source: row.categorySource,
        participants: [
          {
            user_id: user.id,
            paid_amount: row.amount,
            owed_amount: row.amount,
          },
        ],
        source: 'import',
        status: 'draft',
      }))

      if (drafts.length === 0) {
        setMessage('No valid rows found. Check your column mapping.')
        setLoading(false)
        return
      }

      const rulesToSave = previewRows
        .filter((row) => rememberRules[row.index])
        .reduce((acc, row) => {
          const key = normalizeMerchantKey(row.merchant)
          if (!key) return acc
          acc.set(key, {
            user_id: user.id,
            match_text: key,
            category: row.category,
            is_regex: false,
          })
          return acc
        }, new Map<string, { user_id: string; match_text: string; category: string; is_regex: boolean }>())

      const rulesToInsert = Array.from(rulesToSave.values())

      if (rulesToInsert.length > 0) {
        const { error: ruleError } = await supabase
          .from('merchant_rules')
          .upsert(rulesToInsert, { onConflict: 'user_id,match_text' })

        if (ruleError) {
          setMessage(ruleError.message)
          setLoading(false)
          return
        }
      }

      const { error } = await supabase.from('expense_drafts').insert(drafts)
      if (error) {
        setMessage(error.message)
        setLoading(false)
        return
      }

      setMessage(`Imported ${drafts.length} drafts. Review them in Drafts.`)
      setHeaders([])
      setRows([])
      setMapping({
        date: '',
        amount: '',
        merchant: '',
        category: '',
      })
      setCategoryOverrides({})
      setRememberRules({})
      setPreviewPage(1)
    } catch (err) {
      setMessage('Import failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {message && (
        <div className="rounded-md bg-stone-50 p-3 text-sm text-stone-600">{message}</div>
      )}

      <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
        <h2 className="text-lg font-semibold text-stone-900">Upload CSV, PDF, or Receipt</h2>
        <p className="mt-1 text-sm text-stone-500">
          Upload a bank CSV, PDF statement, or receipt and map the columns below.
        </p>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 shadow-soft-sm hover:bg-stone-50">
          <span>Choose file</span>
          <input
            type="file"
            accept=".csv,.pdf,image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {headers.length > 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
          <h2 className="text-lg font-semibold text-stone-900">Map columns</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-stone-600">Date</label>
              <select
                value={mapping.date}
                onChange={(e) => setMapping((prev) => ({ ...prev, date: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              >
                <option value="">Select column</option>
                {headers.map((header) => (
                  <option key={`date-${header}`} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-600">Amount</label>
              <select
                value={mapping.amount}
                onChange={(e) => setMapping((prev) => ({ ...prev, amount: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              >
                <option value="">Select column</option>
                {headers.map((header) => (
                  <option key={`amount-${header}`} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-600">Merchant</label>
              <select
                value={mapping.merchant}
                onChange={(e) => setMapping((prev) => ({ ...prev, merchant: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              >
                <option value="">Select column</option>
                {headers.map((header) => (
                  <option key={`merchant-${header}`} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-stone-600">Category (optional)</label>
              <select
                value={mapping.category}
                onChange={(e) => setMapping((prev) => ({ ...prev, category: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-stone-200 px-3 py-2 text-sm"
              >
                <option value="">None</option>
                {headers.map((header) => (
                  <option key={`category-${header}`} value={header}>
                    {header}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={budgetImpact}
              onChange={(e) => setBudgetImpact(e.target.checked)}
              className="h-4 w-4 rounded border-stone-300 text-sage-600 focus:ring-sage-500"
            />
            Apply to budget by default
          </div>
        </div>
      ) : null}

      {parsedRows.length > 0 ? (
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-stone-900">Preview</h2>
            <span className="text-sm text-stone-500">
              {previewRows.length} drafts ready
            </span>
          </div>
          <div className="mt-4 divide-y divide-stone-100">
            {previewRows
              .slice((previewPage - 1) * pageSize, previewPage * pageSize)
              .map((row) => (
              <div key={`${row.date}-${row.index}`} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-stone-800">{row.merchant}</p>
                    <p className="text-xs text-stone-500">
                      {row.category || 'Uncategorized'} • {row.date}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-stone-800">
                    ${row.amount?.toFixed(2)}
                  </p>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <select
                    value={categoryOverrides[row.index] || row.category}
                    onChange={(e) =>
                      setCategoryOverrides((prev) => ({
                        ...prev,
                        [row.index]: e.target.value,
                      }))
                    }
                    className="rounded-md border border-stone-200 px-2 py-1 text-xs"
                  >
                    {categoryOptions.map((option) => (
                      <option key={`${row.index}-${option}`} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                  <label className="flex items-center gap-2 text-xs text-stone-500">
                    <input
                      type="checkbox"
                      checked={rememberRules[row.index] || false}
                      onChange={(e) =>
                        setRememberRules((prev) => ({
                          ...prev,
                          [row.index]: e.target.checked,
                        }))
                      }
                      className="h-3.5 w-3.5 rounded border-stone-300 text-sage-600"
                    />
                    Remember this category
                  </label>
                </div>
              </div>
            ))}
          </div>
          {previewRows.length > pageSize ? (
            <div className="mt-4 flex items-center justify-between text-xs text-stone-500">
              <button
                type="button"
                onClick={() => setPreviewPage((prev) => Math.max(prev - 1, 1))}
                disabled={previewPage === 1}
                className="rounded-md border border-stone-200 px-2 py-1 disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {previewPage} of {Math.ceil(previewRows.length / pageSize)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPreviewPage((prev) =>
                    Math.min(prev + 1, Math.ceil(previewRows.length / pageSize))
                  )
                }
                disabled={previewPage >= Math.ceil(previewRows.length / pageSize)}
                className="rounded-md border border-stone-200 px-2 py-1 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {headers.length > 0 ? (
        <button
          type="button"
          onClick={handleImport}
          disabled={loading}
          className="w-full rounded-lg bg-[#1f6f5b] px-4 py-2.5 font-medium text-white shadow-soft-sm transition hover:bg-[#195a4a] disabled:opacity-50"
        >
          {loading ? 'Importing...' : `Import ${previewRows.length} drafts`}
        </button>
      ) : null}
    </div>
  )
}
