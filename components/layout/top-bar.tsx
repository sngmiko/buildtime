'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
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
    <header className="flex h-14 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <span className="text-lg font-bold">BuildTime</span>
        <span className="hidden text-sm text-zinc-500 dark:text-zinc-400 sm:inline">
          {companyName}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-sm text-zinc-600 dark:text-zinc-400 sm:inline">
          {userName}
        </span>
        <Button variant="ghost" size="sm" onClick={handleLogout}>
          Abmelden
        </Button>
      </div>
    </header>
  )
}
