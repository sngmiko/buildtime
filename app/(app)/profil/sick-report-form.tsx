'use client'

import { useActionState, useState } from 'react'
import { reportSick, type EmployeeState } from '@/actions/employee'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'

export function SickReportForm() {
  const [state, action, pending] = useActionState<EmployeeState, FormData>(reportSick, null)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  function calcDays() {
    if (!startDate || !endDate) return null
    const start = new Date(startDate)
    const end = new Date(endDate)
    if (end < start) return null
    return Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1
  }

  const days = calcDays()

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">Krankmeldung einreichen</h2>
      <Card>
        <form action={action} className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Erkrankt ab"
            name="start_date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="Voraussichtlich bis"
            name="end_date"
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate}
          />
          {days !== null && (
            <p className="text-xs text-slate-500 sm:col-span-2">
              Dauer: <span className="font-semibold text-slate-700">{days} {days === 1 ? 'Tag' : 'Tage'}</span>
            </p>
          )}
          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                name="has_certificate"
                className="h-4 w-4 rounded border-slate-300 accent-[#1e3a5f]"
              />
              AU-Bescheinigung liegt vor / wird nachgereicht
            </label>
          </div>
          <div className="sm:col-span-2">
            <Input label="Bemerkung (optional)" name="notes" />
          </div>
          {state?.message && (
            <p className={`text-xs sm:col-span-2 ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>
              {state.message}
            </p>
          )}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending} size="sm">
              {pending ? 'Einreichen...' : 'Krankmeldung einreichen'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
