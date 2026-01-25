import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SetBudgetForm from '@/components/groups/SetBudgetForm'

export default async function SetBudgetPage({
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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-stone-900">Set Monthly Budget</h1>
          <p className="mt-2 text-sm text-stone-500">
            Establish your spending boundary
          </p>
          <p className="mt-1 text-xs text-stone-500">
            This is the amount you want to spend from BudgetWise this month.
            Your salary & savings are never touched.
          </p>
        </div>
        <SetBudgetForm groupId={params.id} />
      </div>
    </main>
  )
}