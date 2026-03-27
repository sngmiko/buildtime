'use client'

import { useState } from 'react'
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import Link from 'next/link'

type NotificationItem = {
  type: string
  title: string
  message: string
  severity: string
  link?: string
}

export function NotificationBell({ notifications }: { notifications: NotificationItem[] }) {
  const [open, setOpen] = useState(false)
  const count = notifications.length

  const severityIcons = {
    critical: <AlertCircle className="h-4 w-4 text-red-500" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500" />,
    info: <Info className="h-4 w-4 text-blue-500" />,
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors"
      >
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-white/10 bg-[#1a1a2e] shadow-xl">
            <div className="border-b border-white/10 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-100">Benachrichtigungen</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-slate-400">Keine Warnungen</p>
              ) : (
                notifications.slice(0, 10).map((n, i) => (
                  <Link
                    key={i}
                    href={n.link || '#'}
                    onClick={() => setOpen(false)}
                    className="flex gap-3 border-b border-white/5 px-4 py-3 hover:bg-white/5 transition-colors"
                  >
                    {severityIcons[n.severity as keyof typeof severityIcons] || severityIcons.info}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-100 truncate">{n.title}</p>
                      <p className="text-xs text-slate-400 truncate">{n.message}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <div className="border-t border-white/10 px-4 py-2">
                <Link href="/benachrichtigungen" onClick={() => setOpen(false)} className="text-xs font-medium text-[#f59e0b] hover:underline">
                  Alle anzeigen
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
