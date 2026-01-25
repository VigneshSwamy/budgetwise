import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import CreateGroupForm from '@/components/groups/CreateGroupForm'

export default async function CreateGroupPage() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      redirect('/login')
    }
  } catch (err) {
    // If there's an error (e.g., env vars missing), redirect to login
    redirect('/login')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-stone-900">
            Create Your First Group
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            Define who this money is for
          </p>
        </div>
        <CreateGroupForm />
      </div>
    </main>
  )
}