import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import AddTransactionChooser from '@/components/expenses/AddTransactionChooser'
import InviteMemberForm from '@/components/groups/InviteMemberForm'

export default async function ExpensesPage({
  params,
  searchParams,
}: {
  params: { id: string }
  searchParams?: { page?: string }
}) {
  const page = Math.max(Number(searchParams?.page || 1), 1)
  const pageSize = 20
  const rangeFrom = (page - 1) * pageSize
  const rangeTo = rangeFrom + pageSize - 1
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

  const { data: group } = await supabase
    .from('groups')
    .select('id, name')
    .eq('id', params.id)
    .single()

  const { data: expenses } = await supabase
    .from('expenses')
    .select('id, amount, merchant, date, budget_impact, category, created_at, receipt_url')
    .eq('group_id', params.id)
    .order('date', { ascending: false })
    .range(rangeFrom, rangeTo)

  const { count } = await supabase
    .from('expenses')
    .select('*', { count: 'exact', head: true })
    .eq('group_id', params.id)

  const receiptsWithUrls = await Promise.all(
    (expenses || []).map(async (expense) => {
      if (!expense.receipt_url) {
        return { id: expense.id, url: null }
      }

      const { data } = await supabase.storage
        .from('receipts')
        .createSignedUrl(expense.receipt_url, 60 * 60)

      return { id: expense.id, url: data?.signedUrl || null }
    })
  )

  const receiptMap = new Map(receiptsWithUrls.map((r) => [r.id, r.url]))

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">
              Confirmed Expenses
            </h1>
            <p className="text-sm text-stone-500">
              {group?.name || 'Group'}
            </p>
          </div>
          <AddTransactionChooser groupId={params.id} label="Add Transaction" />
        </div>

        {expenses && expenses.length > 0 ? (
          <div className="space-y-4">
            {expenses.map((expense) => {
              const receiptUrl = receiptMap.get(expense.id) || null

              const isImage = receiptUrl
                ? /\.(png|jpe?g|gif|webp)$/i.test(receiptUrl)
                : false

              return (
              <div
                key={expense.id}
                className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">
                      <Link
                        href={`/groups/${params.id}/expenses/${expense.id}`}
                        className="hover:text-sage-700 hover:underline"
                      >
                        {expense.merchant || 'Untitled expense'}
                      </Link>
                    </h3>
                    <p className="text-sm text-stone-500">
                      {expense.category || 'Uncategorized'} • {expense.date}
                    </p>
                    {receiptUrl ? (
                      <div className="mt-3 flex items-center gap-3">
                        {isImage ? (
                          <a
                            href={receiptUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex"
                          >
                            <Image
                              src={receiptUrl}
                              alt="Receipt preview"
                              width={56}
                              height={56}
                              className="h-14 w-14 rounded-lg border border-stone-200 object-cover shadow-soft-sm"
                              unoptimized
                            />
                          </a>
                        ) : null}
                        <a
                          href={receiptUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium text-stone-700 hover:text-sage-700 hover:underline"
                        >
                          View receipt
                        </a>
                      </div>
                    ) : null}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-stone-900">
                      -${Number(expense.amount).toFixed(2)}
                    </p>
                    <span
                      className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        expense.budget_impact
                          ? 'bg-sage-100 text-sage-700'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {expense.budget_impact ? 'Budget impact' : 'Split-only'}
                    </span>
                  </div>
                </div>
              </div>
            )})}
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-soft-md">
            <p className="mb-2 text-stone-600">No confirmed expenses yet.</p>
            <Link
              href={`/groups/${params.id}/expenses/new`}
              className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
            >
              Create your first draft
            </Link>
          </div>
        )}

        {count && count > pageSize ? (
          <div className="flex items-center justify-between text-sm text-stone-500">
            <Link
              href={`/groups/${params.id}/expenses?page=${page - 1}`}
              className={`rounded-md border border-stone-200 px-3 py-1 ${
                page <= 1 ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Previous
            </Link>
            <span>
              Page {page} of {Math.ceil(count / pageSize)}
            </span>
            <Link
              href={`/groups/${params.id}/expenses?page=${page + 1}`}
              className={`rounded-md border border-stone-200 px-3 py-1 ${
                page >= Math.ceil(count / pageSize) ? 'pointer-events-none opacity-50' : ''
              }`}
            >
              Next
            </Link>
          </div>
        ) : null}

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md">
          <InviteMemberForm groupId={params.id} />
        </div>
      </div>
    </main>
  )
}
