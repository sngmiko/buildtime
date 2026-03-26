'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import type { UserRole } from '@/lib/types'

type NavItem = {
  href: string
  label: string
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', roles: ['owner', 'foreman'] },
  { href: '/mitarbeiter', label: 'Mitarbeiter', roles: ['owner', 'foreman'] },
  { href: '/firma', label: 'Firma', roles: ['owner'] },
  { href: '/profil', label: 'Profil', roles: ['owner', 'foreman'] },
]

export function ManagerSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg md:hidden dark:bg-zinc-100 dark:text-zinc-900"
        onClick={() => setOpen(!open)}
        aria-label="Navigation öffnen"
      >
        {open ? '\u2715' : '\u2630'}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-56 flex-col border-r border-zinc-200 bg-white pt-14 transition-transform dark:border-zinc-800 dark:bg-zinc-900 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col gap-1 p-3">
          {items.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
