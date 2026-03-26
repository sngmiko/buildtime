import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ProfileForm } from './profile-form'
import type { Profile } from '@/lib/types'

export default async function ProfilePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Mein Profil</h1>
      <Card className="max-w-lg">
        <ProfileForm profile={profile} email={user.email || ''} />
      </Card>
    </div>
  )
}
