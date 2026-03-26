'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const WORKER_TABS = [
  { href: '/stempeln', label: 'Stempeln' },
  { href: '/zeiten', label: 'Meine Zeiten' },
  { href: '/profil', label: 'Profil' },
]

export function WorkerBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:hidden">
      {WORKER_TABS.map((tab) => {
        const active = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex flex-1 flex-col items-center justify-center py-3 text-xs font-medium transition-colors ${
              active
                ? 'text-zinc-900 dark:text-zinc-100'
                : 'text-zinc-500 dark:text-zinc-400'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
