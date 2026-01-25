'use server'

import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function setActiveGroup(groupId: string) {
  cookies().set('bw_active_group', groupId, {
    path: '/',
    sameSite: 'lax',
  })
}

export async function deleteGroup(groupId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('groups').delete().eq('id', groupId)

  if (error) {
    throw new Error(error.message)
  }

  cookies().delete('bw_active_group')
}
