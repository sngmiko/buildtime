'use client'

import { useActionState } from 'react'
import { createLeaveRequest, type EmployeeState } from '@/actions/employee'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import type { LeaveRequest } from '@/lib/types'

export function LeaveRequestSection({ leaveRequests }: { leaveRequests: LeaveRequest[] }) {
  const [state, action, pending] = useActionState<EmployeeState, FormData>(createLeaveRequest, null)

  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    pending: { label: 'Offen', color: 'bg-amber-100 text-amber-700' },
    approved: { label: 'Genehmigt', color: 'bg-emerald-100 text-emerald-700' },
    rejected: { label: 'Abgelehnt', color: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-slate-900">Urlaubsanträge</h2>

      {leaveRequests.length > 0 && (
        <Card className="p-0">
          <div className="divide-y divide-slate-100">
            {leaveRequests.map(l => {
              const st = STATUS_LABELS[l.status] || STATUS_LABELS.pending
              return (
                <div key={l.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {new Date(l.start_date).toLocaleDateString('de-DE')} – {new Date(l.end_date).toLocaleDateString('de-DE')}
                    </p>
                    <p className="text-xs text-slate-500">{l.days} Tage · {{ vacation: 'Urlaub', sick: 'Krank', unpaid: 'Unbezahlt', special: 'Sonderurlaub' }[l.type]}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${st.color}`}>{st.label}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-3 text-sm font-semibold text-slate-900">Neuen Antrag stellen</h3>
        <form action={action} className="grid gap-3 sm:grid-cols-2">
          <Input label="Von" name="start_date" type="date" required />
          <Input label="Bis" name="end_date" type="date" required />
          <Input label="Anzahl Tage" name="days" type="number" min="1" required />
          <Select label="Art" name="type" options={[
            { value: 'vacation', label: 'Urlaub' },
            { value: 'special', label: 'Sonderurlaub' },
            { value: 'unpaid', label: 'Unbezahlter Urlaub' },
          ]} />
          <div className="sm:col-span-2">
            <Input label="Bemerkung (optional)" name="notes" />
          </div>
          {state?.message && <p className={`text-xs sm:col-span-2 ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={pending} size="sm">{pending ? 'Einreichen...' : 'Urlaubsantrag einreichen'}</Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
