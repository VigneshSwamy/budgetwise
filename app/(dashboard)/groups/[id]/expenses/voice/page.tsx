import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import VoiceDraftForm from '@/components/expenses/VoiceDraftForm'

export default async function VoiceDraftPage({
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
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-stone-900">Voice Expense</h1>
          <p className="mt-2 text-sm text-stone-500">
            Record a short voice note and we’ll create the expense.
          </p>
        </div>

        <VoiceDraftForm groupId={params.id} />

        <div className="text-center">
          <Link
            href={`/groups/${params.id}/expenses`}
            className="text-sm font-medium text-stone-700 hover:text-sage-700 hover:underline"
          >
            View expenses
          </Link>
        </div>
      </div>
    </main>
  )
}
