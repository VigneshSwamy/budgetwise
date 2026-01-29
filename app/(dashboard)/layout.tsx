import { redirect } from 'next/navigation'
import LogoutButton from '@/components/shared/LogoutButton'
import SidebarNav from '@/components/layout/SidebarNav'
import GroupSwitcher from '@/components/layout/GroupSwitcher'
import ProfileSummary from '@/components/layout/ProfileSummary'
import ResizableSidebar from '@/components/layout/ResizableSidebar'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let groups: { id: string; name: string }[] = []
  try {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name)')
      .eq('user_id', user.id)

    groups =
      data?.map((row) => ({
        id: row.group_id as string,
        name: (row.groups as any)?.name || 'Group',
      })) || []
  } catch (err) {
    groups = []
  }

  const activeGroupId = cookies().get('bw_active_group')?.value
  const activeGroup = groups.find((group) => group.id === activeGroupId)

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('id', user.id)
    .single()

  let avatarSignedUrl: string | null = null
  if (profile?.avatar_url) {
    const { data: publicData } = supabase.storage
      .from('avatars')
      .getPublicUrl(profile.avatar_url)
    avatarSignedUrl = publicData?.publicUrl || null

    if (!avatarSignedUrl) {
      const { data } = await supabase.storage
        .from('avatars')
        .createSignedUrl(profile.avatar_url, 60 * 60 * 24 * 7)
      avatarSignedUrl = data?.signedUrl || null
    }
  }

  return (
    <ResizableSidebar
      sidebar={
        <div className="flex h-full flex-col">
          <div className="mb-8 flex items-center gap-3">
            <a
              href="/dashboard"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#8FA888] text-[#FBF8F3] shadow-lg shadow-[#8FA888]/20"
              aria-label="BudgetWise home"
            >
              B
            </a>
            <a href="/dashboard" className="text-lg font-semibold text-[#3D3D3D]">
              BudgetWise
            </a>
          </div>

          <GroupSwitcher groups={groups} activeGroupId={activeGroup?.id || groups[0]?.id} />

          <SidebarNav />

          <div className="mt-auto border-t border-[#E5E0D8] pt-6">
            <ProfileSummary
              displayName={profile?.display_name || user.email?.split('@')[0] || 'User'}
              email={user.email}
              avatarUrl={avatarSignedUrl}
            />
            <LogoutButton />
          </div>
        </div>
      }
    >
      {children}
    </ResizableSidebar>
  )
}
