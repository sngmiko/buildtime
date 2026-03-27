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
    <div className="flex items-start gap-3 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4">
      <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
      <div className="flex-1 text-sm text-blue-300">{children}</div>
      <button
        onClick={handleDismiss}
        className="shrink-0 rounded-lg p-1 text-blue-400 hover:bg-blue-500/10 hover:text-blue-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
