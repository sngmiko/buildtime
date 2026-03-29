'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { updateWorkshopStatus, updateWorkshopCosts, type WorkshopState } from '@/actions/workshop'
import type { WorkshopEntry } from '@/lib/types'

const STATUS_FLOW: Record<string, { next: string; label: string }[]> = {
  received: [{ next: 'in_repair', label: 'Reparatur starten' }],
  in_repair: [{ next: 'done', label: 'Als fertig markieren' }],
  done: [{ next: 'picked_up', label: 'Abgeholt' }],
  picked_up: [],
}

export function WorkshopActions({ entry }: { entry: WorkshopEntry }) {
  const router = useRouter()
  const boundCosts = updateWorkshopCosts.bind(null, entry.id)
  const [costState, costAction, costPending] = useActionState<WorkshopState, FormData>(boundCosts, null)

  const nextSteps = STATUS_FLOW[entry.status] || []

  async function handleStatusChange(newStatus: string) {
    await updateWorkshopStatus(entry.id, newStatus)
    router.refresh()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {nextSteps.length > 0 && (
        <Card>
          <h3 className="mb-3 font-semibold text-slate-900">Status ändern</h3>
          <div className="flex gap-2">
            {nextSteps.map(step => (
              <Button key={step.next} onClick={() => handleStatusChange(step.next)}>
                {step.label}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-3 font-semibold text-slate-900">Kosten aktualisieren</h3>
        <form action={costAction} className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <Input label="Teile (€)" name="cost_parts" type="number" step="0.01" defaultValue={String(entry.cost_parts)} />
            <Input label="Arbeit (€)" name="cost_labor" type="number" step="0.01" defaultValue={String(entry.cost_labor)} />
            <Input label="Extern (€)" name="cost_external" type="number" step="0.01" defaultValue={String(entry.cost_external)} />
          </div>
          <Input label="Notizen" name="notes" defaultValue={entry.notes || ''} />
          {costState?.message && <p className={`text-sm ${costState.success ? 'text-emerald-600' : 'text-red-600'}`}>{costState.message}</p>}
          <Button type="submit" disabled={costPending} variant="outline">{costPending ? 'Speichern...' : 'Kosten speichern'}</Button>
        </form>
      </Card>
    </div>
  )
}
