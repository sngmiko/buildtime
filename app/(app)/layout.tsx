import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/top-bar'
import { ManagerSidebar } from '@/components/layout/manager-sidebar'
import { WorkerBottomNav } from '@/components/layout/worker-bottom-nav'
import { TrialBanner } from '@/components/layout/trial-banner'
import { ToastProvider } from '@/components/ui/toast'
import { QuickActions } from '@/components/layout/quick-actions'
import { generateNotifications } from '@/lib/queries/notifications'
import type { Profile, Company, CompanyExtended } from '@/lib/types'

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
  const notifications = await generateNotifications(supabase, profile.company_id)

  return (
    <div className="flex flex-1 flex-col">
      <TopBar userName={userName} companyName={companyName} notifications={notifications} />
      {company && <TrialBanner company={company as CompanyExtended} />}
      <div className="flex flex-1">
        {!isWorker && <ManagerSidebar role={profile.role} />}
        <ToastProvider>
          <main className={`flex flex-1 flex-col p-4 md:p-6 bg-gradient-subtle ${isWorker ? 'pb-24 md:pb-6' : ''}`}>
            {children}
            {!isWorker && (
              <footer className="mt-auto pt-8 text-center text-xs text-slate-400">
                BuildTime ist ein Produkt von{' '}
                <a href="https://nomad-solutions.de" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 transition-colors">
                  Nomad Solutions
                </a>
              </footer>
            )}
          </main>
        </ToastProvider>
      </div>
      {isWorker && <WorkerBottomNav />}
      {!isWorker && <QuickActions />}
    </div>
  )
}
