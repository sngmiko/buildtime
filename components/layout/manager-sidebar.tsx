'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, HardHat, ClipboardList, Truck, Package,
  Briefcase, FileText, CalendarDays, UsersRound, BookOpen, Building2,
  User, Menu, X, Search,
} from 'lucide-react'
import type { UserRole } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: LucideIcon
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner', 'foreman', 'super_admin'] },
  { href: '/mitarbeiter', label: 'Mitarbeiter', icon: Users, roles: ['owner', 'foreman', 'super_admin'] },
  { href: '/baustellen', label: 'Baustellen', icon: HardHat, roles: ['owner', 'foreman', 'super_admin'] },
  { href: '/zeitmanagement', label: 'Zeitmanagement', icon: ClipboardList, roles: ['owner', 'foreman', 'super_admin'] },
  { href: '/auftraege', label: 'Aufträge', icon: Briefcase, roles: ['owner', 'foreman', 'super_admin'] },
  { href: '/rechnungen', label: 'Rechnungen', icon: FileText, roles: ['owner', 'foreman', 'super_admin'] },
  { href: '/planung', label: 'Disposition', icon: CalendarDays, roles: ['owner', 'foreman', 'super_admin'] },
  { href: '/fuhrpark', label: 'Fuhrpark', icon: Truck, roles: ['owner', 'foreman', 'super_admin'] },
  { href: '/lager', label: 'Lager & Einkauf', icon: Package, roles: ['owner', 'foreman', 'super_admin'] },
  { href: '/subunternehmer', label: 'Subunternehmer', icon: UsersRound, roles: ['owner', 'foreman', 'super_admin'] },
  { href: '/bautagebuch', label: 'Bautagebuch', icon: BookOpen, roles: ['owner', 'foreman', 'super_admin'] },
  { href: '/firma', label: 'Firma', icon: Building2, roles: ['owner', 'super_admin'] },
  { href: '/profil', label: 'Profil', icon: User, roles: ['owner', 'foreman', 'super_admin'] },
]

export function ManagerSidebar({ role }: { role: UserRole }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const items = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <>
      {/* Mobile FAB */}
      <button
        className="fixed bottom-20 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Navigation"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-slate-900 transition-transform duration-300 md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f59e0b]">
            <HardHat className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white">Build<span className="text-[#f59e0b]">Time</span></span>
        </div>

        {/* Search hint */}
        <div className="mx-4 mb-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-search'))}
            className="flex w-full items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-700 hover:text-slate-300"
          >
            <Search className="h-4 w-4" />
            <span>Suche...</span>
            <kbd className="ml-auto rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-500">⌘K</kbd>
          </button>
        </div>

        {/* Nav label */}
        <div className="px-6 pb-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Navigation</p>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
          {items.map((item) => {
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-all duration-150 ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-[18px] w-[18px] ${active ? 'text-[#f59e0b]' : ''}`} />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-800 px-6 py-4">
          <p className="text-[10px] text-slate-600">© 2026 Nomad Solutions</p>
        </div>
      </aside>
    </>
  )
}
