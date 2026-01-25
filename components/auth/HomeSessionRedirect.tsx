'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function HomeSessionRedirect() {
  const router = useRouter()

  useEffect(() => {
    const redirectIfLoggedIn = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data: groups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id)
        .limit(1)

      if (groups && groups.length > 0) {
        router.replace('/dashboard')
      } else {
        router.replace('/groups/create')
      }
    }

    redirectIfLoggedIn()
  }, [router])

  return null
}
