import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

export default async function ExpenseDetailPage({
  params,
}: {
  params: { id: string; expenseId: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  try {
    const { data: member, error } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('group_id', params.id)
      .eq('user_id', user.id)
      .single()

    if (error || !member) {
      redirect('/dashboard')
    }
  } catch (err) {
    redirect('/dashboard')
  }

  const { data: expense } = await supabase
    .from('expenses')
    .select('id, amount, merchant, date, category, budget_impact, notes, receipt_url')
    .eq('group_id', params.id)
    .eq('id', params.expenseId)
    .single()

  if (!expense) {
    redirect(`/groups/${params.id}/expenses`)
  }

  const { data: payments } = await supabase
    .from('expense_payments')
    .select('id, user_id, paid_amount')
    .eq('expense_id', params.expenseId)

  const { data: shares } = await supabase
    .from('expense_shares')
    .select('id, user_id, owed_amount')
    .eq('expense_id', params.expenseId)

  let receiptPublicUrl: string | null = null
  if (expense.receipt_url) {
    const { data } = await supabase.storage
      .from('receipts')
      .createSignedUrl(expense.receipt_url, 60 * 60)
    receiptPublicUrl = data?.signedUrl || null
  }
  const isImage = receiptPublicUrl
    ? /\.(png|jpe?g|gif|webp)$/i.test(receiptPublicUrl)
    : false

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              {expense.merchant || 'Untitled expense'}
            </h1>
            <p className="text-sm text-stone-500">
              {expense.category || 'Uncategorized'} • {expense.date}
            </p>
          </div>
          <Link
            href={`/groups/${params.id}/expenses`}
            className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
          >
            Back to expenses
          </Link>
        </div>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-stone-500">Amount</p>
              <p className="text-3xl font-bold text-stone-900">
                ${Number(expense.amount).toFixed(2)}
              </p>
            </div>
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                expense.budget_impact
                  ? 'bg-sage-100 text-sage-700'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {expense.budget_impact ? 'Budget impact' : 'Split-only'}
            </span>
          </div>
          {expense.notes ? (
            <p className="mt-4 text-sm text-stone-600">{expense.notes}</p>
          ) : null}
          {receiptPublicUrl ? (
            <div className="mt-4 flex items-center gap-4">
              {isImage ? (
                <a href={receiptPublicUrl} target="_blank" rel="noreferrer">
                  <Image
                    src={receiptPublicUrl}
                    alt="Receipt preview"
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-xl border border-stone-200 object-cover shadow-soft-sm"
                    unoptimized
                  />
                </a>
              ) : null}
              <a
                href={receiptPublicUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
              >
                View receipt
              </a>
            </div>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
            <h2 className="text-lg font-semibold text-stone-900">Payments</h2>
            {payments && payments.length > 0 ? (
              <div className="mt-4 space-y-2">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between rounded-lg border border-stone-100 px-4 py-3"
                  >
                    <span className="text-sm text-stone-600">
                      Member {payment.user_id.slice(0, 6)}
                    </span>
                    <span className="text-sm font-semibold text-stone-900">
                      ${Number(payment.paid_amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-500">No payments found.</p>
            )}
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
            <h2 className="text-lg font-semibold text-stone-900">Shares</h2>
            {shares && shares.length > 0 ? (
              <div className="mt-4 space-y-2">
                {shares.map((share) => (
                  <div
                    key={share.id}
                    className="flex items-center justify-between rounded-lg border border-stone-100 px-4 py-3"
                  >
                    <span className="text-sm text-stone-600">
                      Member {share.user_id.slice(0, 6)}
                    </span>
                    <span className="text-sm font-semibold text-stone-900">
                      ${Number(share.owed_amount).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-500">No shares found.</p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
