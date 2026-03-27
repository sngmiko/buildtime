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
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-100 bg-white px-6">
      <div className="flex items-center gap-3 text-sm text-slate-500">
        <Building2 className="h-4 w-4" />
        <span>{companyName}</span>
      </div>
      <div className="flex items-center gap-3">
        <SearchBar />
        <NotificationBell notifications={notifications} />
        <div className="h-6 w-px bg-slate-200" />
        <span className="hidden text-sm text-slate-600 sm:inline">{userName}</span>
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
