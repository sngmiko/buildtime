'use client'

import { useState } from 'react'
import { Plus, X, Clock, HardHat, UserPlus, Briefcase, Package, BookOpen } from 'lucide-react'
import Link from 'next/link'

const ACTIONS = [
  { href: '/stempeln', label: 'Zeit erfassen', icon: Clock, color: 'bg-emerald-500' },
  { href: '/baustellen/neu', label: 'Baustelle anlegen', icon: HardHat, color: 'bg-blue-500' },
  { href: '/mitarbeiter/einladen', label: 'Mitarbeiter einladen', icon: UserPlus, color: 'bg-purple-500' },
  { href: '/auftraege/neu', label: 'Auftrag erstellen', icon: Briefcase, color: 'bg-amber-500' },
  { href: '/lager/material-neu', label: 'Material anlegen', icon: Package, color: 'bg-teal-500' },
  { href: '/bautagebuch/neu', label: 'Bautagebuch-Eintrag', icon: BookOpen, color: 'bg-rose-500' },
]

export function QuickActions() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
      {/* Action items */}
      {open && (
        <div className="flex flex-col gap-2 mb-2" style={{ animation: 'fadeIn 0.2s ease-out' }}>
          {ACTIONS.map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-xl bg-[#1a1a2e] px-4 py-3 shadow-lg border border-white/10 hover:shadow-xl transition-all group"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.color} text-white`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-300 group-hover:text-white">{action.label}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* FAB Button */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
          open
            ? 'bg-slate-700 rotate-45 hover:bg-slate-600'
            : 'bg-[#f59e0b] hover:bg-[#fbbf24] hover:scale-110'
        }`}
      >
        {open ? <X className="h-6 w-6 text-white" /> : <Plus className="h-6 w-6 text-white" />}
      </button>
    </div>
  )
}
