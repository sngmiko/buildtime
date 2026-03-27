'use client'

import { useState } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { dismissTip } from '@/actions/activity'

export function TipBanner({
  tipKey,
  children,
  dismissed = false,
}: {
  tipKey: string
  children: React.ReactNode
  dismissed?: boolean
}) {
  const [hidden, setHidden] = useState(dismissed)

  async function handleDismiss() {
    setHidden(true)
    await dismissTip(tipKey)
  }

  if (hidden) return null

  return (
    <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-blue-500" />
      <div className="flex-1 text-sm text-blue-700">{children}</div>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded-lg p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
