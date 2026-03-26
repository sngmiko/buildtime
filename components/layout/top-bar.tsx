'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TopBar({
  userName,
  companyName,
}: {
  userName: string
  companyName: string
}) {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold text-[--color-primary]">Build<span className="text-[--color-accent]">Time</span></span>
        <div className="hidden items-center gap-1.5 text-sm text-slate-500 sm:flex">
          <Building2 className="h-3.5 w-3.5" />
          {companyName}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-slate-600 sm:inline">
          {userName}
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Abmelden</span>
        </Button>
      </div>
    </header>
  )
}
