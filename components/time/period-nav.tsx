'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

type Period = 'week' | 'month'

export function PeriodNav() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const period = (searchParams.get('period') as Period) || 'week'
  const offset = parseInt(searchParams.get('offset') || '0', 10)

  function navigate(newPeriod: Period, newOffset: number) {
    const params = new URLSearchParams()
    params.set('period', newPeriod)
    if (newOffset !== 0) params.set('offset', String(newOffset))
    router.push(`?${params.toString()}`)
  }

  function getLabel(): string {
    const now = new Date()
    if (period === 'week') {
      const start = new Date(now)
      start.setDate(start.getDate() - start.getDay() + 1 + offset * 7)
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${start.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('de-DE', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    return d.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
        <button
          onClick={() => navigate('week', 0)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${period === 'week' ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Woche
        </button>
        <button
          onClick={() => navigate('month', 0)}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${period === 'month' ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
        >
          Monat
        </button>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate(period, offset - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[180px] text-center text-sm font-medium text-slate-700">
          {getLabel()}
        </span>
        <Button variant="outline" size="sm" onClick={() => navigate(period, offset + 1)} disabled={offset >= 0}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {offset !== 0 && (
          <Button variant="ghost" size="sm" onClick={() => navigate(period, 0)}>
            Heute
          </Button>
        )}
      </div>
    </div>
  )
}

export function getDateRange(period: string, offset: number): { start: Date; end: Date } {
  const now = new Date()
  if (period === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0, 23, 59, 59)
    return { start, end }
  }
  // week
  const start = new Date(now)
  start.setDate(start.getDate() - start.getDay() + 1 + offset * 7)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}
