import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import UserSettingsForm from '@/components/settings/UserSettingsForm'
import ProfileForm from '@/components/profile/ProfileForm'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: settings } = await supabase
    .from('user_settings')
    .select(
      'weekly_summary, budget_alert_enabled, budget_alert_threshold, settlement_reminder_enabled'
    )
    .eq('user_id', user.id)
    .single()

  const initialSettings = {
    weekly_summary: settings?.weekly_summary ?? false,
    budget_alert_enabled: settings?.budget_alert_enabled ?? true,
    budget_alert_threshold: settings?.budget_alert_threshold ?? 20,
    settlement_reminder_enabled: settings?.settlement_reminder_enabled ?? true,
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <main className="flex min-h-screen flex-col p-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Settings</h1>
          <p className="text-sm text-stone-500">
            Manage your profile, notifications, and budget alerts.
          </p>
        </div>

        <ProfileForm
          userId={user.id}
          initialDisplayName={profile?.display_name || user.email?.split('@')[0] || 'User'}
          initialAvatarUrl={profile?.avatar_url || null}
          initialEmail={user.email}
        />

        <UserSettingsForm initialSettings={initialSettings} userId={user.id} />
      </div>
    </main>
  )
}
