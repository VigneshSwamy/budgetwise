import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import DraftActions from '@/components/expenses/DraftActions'
import AddTransactionChooser from '@/components/expenses/AddTransactionChooser'
import BulkConfirmDrafts from '@/components/expenses/BulkConfirmDrafts'

export default async function ExpenseDraftsPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify user is member of this group
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

  const { data: drafts } = await supabase
    .from('expense_drafts')
    .select('id, amount, merchant, date, budget_impact, status, created_at')
    .eq('group_id', params.id)
    .eq('status', 'draft')
    .order('created_at', { ascending: false })

  const draftIds = (drafts || []).map((draft) => draft.id)

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-stone-900">Expense Drafts</h1>
            <p className="text-sm text-stone-500">
              {group?.name || 'Group'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/groups/${params.id}/expenses`}
              className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
            >
              Confirmed
            </Link>
            <Link
              href={`/groups/${params.id}/expenses/voice`}
              className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
            >
              Voice draft
            </Link>
            <AddTransactionChooser groupId={params.id} label="Add Transaction" />
          </div>
        </div>

        <BulkConfirmDrafts draftIds={draftIds} />

        {drafts && drafts.length > 0 ? (
          <div className="space-y-4">
            {drafts.map((draft) => (
              <div
                key={draft.id}
                className="rounded-xl border border-stone-200 bg-white p-6 shadow-soft-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-stone-900">
                      {draft.merchant || 'Untitled expense'}
                    </h3>
                    <p className="text-sm text-stone-600">
                      ${Number(draft.amount).toFixed(2)} • {draft.date}
                    </p>
                    <p className="text-xs text-stone-500">
                      {draft.budget_impact ? 'Counts toward budget' : 'Split-only'}
                    </p>
                  </div>
                  <DraftActions draftId={draft.id} />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white p-8 text-center shadow-soft-md">
            <p className="mb-2 text-stone-600">No drafts yet.</p>
            <Link
              href={`/groups/${params.id}/expenses/new`}
              className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
            >
              Create your first draft
            </Link>
          </div>
        )}
      </div>
    </main>
  )
}
