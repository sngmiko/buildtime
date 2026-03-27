'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { LayoutDashboard, Users, Building2, User, Menu, X, HardHat, ClipboardList, Truck, Package, Briefcase, UsersRound, BookOpen } from 'lucide-react'
import type { UserRole } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'foreman'] },
  { href: '/mitarbeiter', label: 'Mitarbeiter', icon: Users, roles: ['owner', 'foreman'] },
  { href: '/baustellen', label: 'Baustellen', icon: HardHat, roles: ['owner', 'foreman'] },
  { href: '/zeitmanagement', label: 'Zeitmanagement', icon: ClipboardList, roles: ['owner', 'foreman'] },
  { href: '/fuhrpark', label: 'Fuhrpark', icon: Truck, roles: ['owner', 'foreman'] },
  { href: '/lager', label: 'Lager & Einkauf', icon: Package, roles: ['owner', 'foreman'] },
  { href: '/auftraege', label: 'Aufträge', icon: Briefcase, roles: ['owner', 'foreman'] },
  { href: '/subunternehmer', label: 'Subunternehmer', icon: UsersRound, roles: ['owner', 'foreman'] },
  { href: '/bautagebuch', label: 'Bautagebuch', icon: BookOpen, roles: ['owner', 'foreman'] },
  { href: '/firma', label: 'Firma', icon: Building2, roles: ['owner'] },
  { href: '/profil', label: 'Profil', icon: User, roles: ['owner', 'foreman'] },
]

export function ManagerSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#1e3a5f] text-white shadow-lg transition-transform hover:scale-105 md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Navigation öffnen"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-slate-200 bg-white pt-14 shadow-sm transition-transform duration-300 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {items.map((item) => {
            const active = pathname.startsWith(item.href)
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-[#1e3a5f] text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="border-t border-slate-200 p-4 text-xs text-slate-400">
          &copy; 2026 Nomad Solutions
        </div>
      </aside>
    </>
  )
}
