import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import StatementImportForm from '@/components/imports/StatementImportForm'

export default async function StatementImportPage({
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

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-stone-900">Statement Import</h1>
          <p className="mt-2 text-sm text-stone-500">
            Upload a CSV or PDF statement and map columns to create drafts.
          </p>
        </div>

        <StatementImportForm groupId={params.id} />

        <div className="text-center">
          <Link
            href={`/groups/${params.id}/expenses`}
            className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
          >
            Back to expenses
          </Link>
        </div>
      </div>
    </main>
  )
}
