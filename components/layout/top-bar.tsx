'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SearchBar } from '@/components/layout/search-bar'
import { NotificationBell } from '@/components/layout/notification-bell'

type NotificationItem = {
  type: string; title: string; message: string; severity: string; link?: string
}

export function TopBar({
  userName,
  companyName,
  notifications,
}: {
  userName: string
  companyName: string
  notifications: NotificationItem[]
}) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/80 px-4 shadow-sm backdrop-blur-md">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-[#1e3a5f]">Build<span className="text-[#f59e0b]">Time</span></span>
        <div className="hidden items-center gap-1.5 text-sm text-slate-500 sm:flex">
          <Building2 className="h-3.5 w-3.5" />
          {companyName}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <SearchBar />
        <NotificationBell notifications={notifications} />
        <span className="hidden text-sm text-slate-600 sm:inline">{userName}</span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}
