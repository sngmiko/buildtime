import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { ManagerSidebar } from '@/components/layout/manager-sidebar'
import { WorkerBottomNav } from '@/components/layout/worker-bottom-nav'
import type { Profile, Company } from '@/lib/types'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) {
    redirect('/registrieren')
  }

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', profile.company_id)
    .single<Company>()

  const userName = `${profile.first_name} ${profile.last_name}`
  const companyName = company?.name || ''
  const isWorker = profile.role === 'worker'

  return (
    <div className="flex flex-1 flex-col">
      <TopBar userName={userName} companyName={companyName} />
      <div className="flex flex-1">
        {!isWorker && <ManagerSidebar role={profile.role} />}
        <main className={`flex flex-1 flex-col p-4 md:p-6 ${isWorker ? 'pb-20 md:pb-6' : ''}`}>
          {children}
        </main>
      </div>
      {isWorker && <WorkerBottomNav />}
    </div>
  )
}
