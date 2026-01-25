import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export const getUserAndFirstGroup = async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  let groups: any[] = []
  try {
    const { data } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name)')
      .eq('user_id', user.id)

    if (data) {
      groups = data
    }
  } catch (err) {
    groups = []
  }

  const activeGroupId = cookies().get('bw_active_group')?.value
  const activeGroup = groups.find((group) => group.group_id === activeGroupId)

  const firstGroupId = (activeGroup?.group_id || groups[0]?.group_id) as
    | string
    | undefined
  const groupName = (activeGroup?.groups?.name ||
    (groups[0]?.groups as any)?.name) as string | undefined

  return { supabase, user, groups, firstGroupId, groupName }
}
