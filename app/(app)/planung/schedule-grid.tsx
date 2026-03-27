'use client'

import { useTransition, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createScheduleEntry, deleteScheduleEntry, type ScheduleState } from '@/actions/schedule'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { X, Plus } from 'lucide-react'
import type { ScheduleEntry } from '@/lib/types'

type Worker = { id: string; first_name: string; last_name: string }
type Site = { id: string; name: string }
type EntryMap = Record<string, Record<string, ScheduleEntry & { construction_sites: { name: string } | null }>>

// Deterministic colour per site id
const SITE_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-emerald-100 text-emerald-800',
  'bg-violet-100 text-violet-800',
  'bg-[#f59e0b]/20 text-amber-800',
  'bg-pink-100 text-pink-800',
  'bg-cyan-100 text-cyan-800',
]

function siteColor(siteId: string) {
  let hash = 0
  for (let i = 0; i < siteId.length; i++) hash = (hash * 31 + siteId.charCodeAt(i)) | 0
  return SITE_COLORS[Math.abs(hash) % SITE_COLORS.length]
}

type AddFormProps = {
  workerId: string
  date: string
  sites: Site[]
  onClose: () => void
}

function AddForm({ workerId, date, sites, onClose }: AddFormProps) {
  const router = useRouter()
  const [state, setState] = useState<ScheduleState>(null)
  const [pending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    formData.set('user_id', workerId)
    formData.set('date', date)
    startTransition(async () => {
      const result = await createScheduleEntry(null, formData)
      if (result?.success) {
        router.refresh()
        onClose()
      } else {
        setState(result)
      }
    })
  }

  return (
    <form action={handleSubmit} className="mt-2 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 shadow-md min-w-[180px]">
      <Select
        label="Baustelle"
        name="site_id"
        options={[
          { value: '', label: '— wählen —' },
          ...sites.map((s) => ({ value: s.id, label: s.name })),
        ]}
      />
      <Select
        label="Schicht"
        name="shift"
        options={[
          { value: 'full', label: 'Ganztag' },
          { value: 'morning', label: 'Vormittag' },
          { value: 'afternoon', label: 'Nachmittag' },
        ]}
      />
      {state?.message && <p className="text-xs text-red-600">{state.message}</p>}
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={pending}>Speichern</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onClose}>Abbrechen</Button>
      </div>
    </form>
  )
}

type Props = {
  workers: Worker[]
  sites: Site[]
  weekDates: string[]
  entryMap: EntryMap
}

export function ScheduleGrid({ workers, sites, weekDates, entryMap }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [addingCell, setAddingCell] = useState<{ workerId: string; date: string } | null>(null)

  const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']

  function handleDelete(entryId: string) {
    startTransition(async () => {
      await deleteScheduleEntry(entryId)
      router.refresh()
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[700px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="w-36 py-2 pr-4 text-left text-xs font-semibold text-slate-500">Mitarbeiter</th>
            {weekDates.map((date, i) => (
              <th key={date} className="min-w-[100px] py-2 px-2 text-center text-xs font-semibold text-slate-500">
                <span>{DAY_LABELS[i]}</span>
                <br />
                <span className="font-normal text-slate-400">
                  {new Date(date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {workers.map((worker) => (
            <tr key={worker.id} className="hover:bg-slate-50/50">
              <td className="py-3 pr-4 font-medium text-slate-900">
                {worker.first_name} {worker.last_name.charAt(0)}.
              </td>
              {weekDates.map((date) => {
                const entry = entryMap[worker.id]?.[date]
                const isAdding = addingCell?.workerId === worker.id && addingCell?.date === date

                return (
                  <td key={date} className="px-2 py-3 align-top">
                    {entry ? (
                      <div className={`group relative flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium ${siteColor(entry.site_id)}`}>
                        <span className="truncate max-w-[80px]">
                          {entry.construction_sites?.name || '—'}
                        </span>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          disabled={pending}
                          className="ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          aria-label="Eintrag löschen"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : isAdding ? (
                      <AddForm
                        workerId={worker.id}
                        date={date}
                        sites={sites}
                        onClose={() => setAddingCell(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setAddingCell({ workerId: worker.id, date })}
                        className="flex h-7 w-full items-center justify-center rounded-md border border-dashed border-slate-200 text-slate-300 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors"
                        aria-label="Zuweisung hinzufügen"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
          {workers.length === 0 && (
            <tr>
              <td colSpan={8} className="py-8 text-center text-sm text-slate-400">
                Keine Mitarbeiter gefunden
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
