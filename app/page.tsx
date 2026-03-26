import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/types'

export default async function RootPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<Pick<Profile, 'role'>>()

  if (!profile) {
    redirect('/registrieren')
  }

  redirect(profile.role === 'worker' ? '/stempeln' : '/dashboard')
}
