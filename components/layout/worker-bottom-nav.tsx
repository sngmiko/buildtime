'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Clock, CalendarDays, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const WORKER_TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/stempeln', label: 'Stempeln', icon: Clock },
  { href: '/zeiten', label: 'Meine Zeiten', icon: CalendarDays },
  { href: '/profil', label: 'Profil', icon: User },
]

export function WorkerBottomNav() {
  const pathname = usePathname()

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 md:hidden">
      <nav className="flex border-t border-white/[0.06] bg-[#12121e] shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">
        {WORKER_TABS.map((tab) => {
          const active = pathname.startsWith(tab.href)
          const Icon = tab.icon
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors ${
                active
                  ? 'text-[#f59e0b]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'text-[#f59e0b]' : ''}`} />
              {tab.label}
            </Link>
          )
        })}
      </nav>
      <div className="bg-[#12121e] pb-[env(safe-area-inset-bottom)] text-center text-[10px] text-slate-700">
        by Nomad Solutions
      </div>
    </div>
  )
}
