'use client'

import { useActionState } from 'react'
import { createWorkshopEntry, type WorkshopState } from '@/actions/workshop'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

type EntityOption = { value: string; label: string }
type EntityGroup = { group: string; options: EntityOption[] }

export function WorkshopForm({ entities }: { entities: EntityGroup[] }) {
  const [state, action, pending] = useActionState<WorkshopState, FormData>(createWorkshopEntry, null)

  const allOptions = entities.flatMap(g => g.options.map(o => ({ ...o, label: `${g.group}: ${o.label}` })))

  return (
    <form action={action} className="flex flex-col gap-4">
      <Select label="Fahrzeug / Maschine *" name="entity_select" options={[
        { value: '', label: 'Bitte wählen...' },
        ...allOptions,
      ]} />
      {/* Hidden fields parsed from entity_select */}
      <input type="hidden" name="entity_type" id="entity_type" />
      <input type="hidden" name="entity_id" id="entity_id" />

      <Select label="Grund *" name="reason" options={[
        { value: 'repair', label: 'Reparatur' },
        { value: 'maintenance', label: 'Wartung' },
        { value: 'tuev', label: 'TÜV / HU' },
        { value: 'inspection', label: 'Inspektion' },
        { value: 'accident', label: 'Unfallschaden' },
      ]} />

      <Input label="Beschreibung" name="description" placeholder="Was ist kaputt / was wird gemacht?" />
      <Input label="Externe Werkstatt (optional)" name="workshop_name" placeholder="Name der Werkstatt" />
      <Input label="Geplante Fertigstellung" name="expected_completion" type="date" />

      <h4 className="mt-2 font-semibold text-slate-700">Kosten (€)</h4>
      <div className="grid grid-cols-3 gap-3">
        <Input label="Teile" name="cost_parts" type="number" step="0.01" defaultValue="0" />
        <Input label="Arbeit" name="cost_labor" type="number" step="0.01" defaultValue="0" />
        <Input label="Extern" name="cost_external" type="number" step="0.01" defaultValue="0" />
      </div>

      <Input label="Notizen" name="notes" placeholder="Zusätzliche Informationen..." />

      {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
      <Button type="submit" disabled={pending} size="lg" className="w-full"
        onClick={() => {
          const sel = (document.querySelector('[name="entity_select"]') as HTMLSelectElement)?.value || ''
          const [type, id] = sel.split(':')
          const typeInput = document.getElementById('entity_type') as HTMLInputElement
          const idInput = document.getElementById('entity_id') as HTMLInputElement
          if (typeInput) typeInput.value = type || ''
          if (idInput) idInput.value = id || ''
        }}
      >
        {pending ? 'Wird erstellt...' : 'Werkstattaufenthalt erstellen'}
      </Button>
    </form>
  )
}
