'use client'

import { useActionState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  updateEmployeeDetails,
  addQualification,
  addBriefing,
  addSickDay,
  approveLeaveRequest,
  type EmployeeState,
} from '@/actions/employee'
import type { ProfileExtended, Qualification, SafetyBriefing, LeaveRequest, SickDay } from '@/lib/types'
import { AlertTriangle, Check, X, Shield, FileText, Calendar, Thermometer } from 'lucide-react'

const TABS = [
  { id: 'details', label: 'Stammdaten', icon: FileText },
  { id: 'qualifications', label: 'Qualifikationen', icon: Shield },
  { id: 'leave', label: 'Urlaub', icon: Calendar },
  { id: 'sick', label: 'Krankheit', icon: Thermometer },
]

export function EmployeeDetailTabs({
  employee, qualifications, briefings, leaveRequests, sickDays, activeTab,
}: {
  employee: ProfileExtended
  qualifications: Qualification[]
  briefings: SafetyBriefing[]
  leaveRequests: LeaveRequest[]
  sickDays: SickDay[]
  activeTab: string
}) {
  const router = useRouter()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => router.push(`?tab=${tab.id}`)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'details' && <DetailsTab employee={employee} briefings={briefings} />}
      {activeTab === 'qualifications' && <QualificationsTab employee={employee} qualifications={qualifications} />}
      {activeTab === 'leave' && <LeaveTab employee={employee} leaveRequests={leaveRequests} />}
      {activeTab === 'sick' && <SickTab employee={employee} sickDays={sickDays} />}
    </div>
  )
}

function DetailsTab({ employee, briefings }: { employee: ProfileExtended; briefings: SafetyBriefing[] }) {
  const boundUpdate = updateEmployeeDetails.bind(null, employee.id)
  const [state, action, pending] = useActionState<EmployeeState, FormData>(boundUpdate, null)
  const boundBriefing = addBriefing.bind(null, employee.id)
  const [bState, bAction, bPending] = useActionState<EmployeeState, FormData>(boundBriefing, null)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Personalien & Vertrag</h3>
        <form action={action} className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Vorname" name="first_name" defaultValue={employee.first_name} required error={state?.errors?.first_name?.[0]} />
            <Input label="Nachname" name="last_name" defaultValue={employee.last_name} required error={state?.errors?.last_name?.[0]} />
          </div>
          <Input label="Telefon" name="phone" defaultValue={employee.phone || ''} />
          <Input label="Adresse" name="address" defaultValue={employee.address || ''} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Geburtsdatum" name="birth_date" type="date" defaultValue={employee.birth_date || ''} />
            <Input label="Nationalität" name="nationality" defaultValue={employee.nationality || ''} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Eintrittsdatum" name="contract_start" type="date" defaultValue={employee.contract_start || ''} />
            <Select label="Vertragsart" name="contract_type" defaultValue={employee.contract_type || ''} options={[
              { value: '', label: '–' }, { value: 'permanent', label: 'Festanstellung' }, { value: 'temporary', label: 'Befristet' }, { value: 'minijob', label: 'Minijob' }, { value: 'intern', label: 'Praktikum' },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Kündigungsfrist" name="notice_period" defaultValue={employee.notice_period || ''} />
            <Input label="Probezeit-Ende" name="probation_end" type="date" defaultValue={employee.probation_end || ''} />
          </div>
          <h4 className="mt-2 font-medium text-slate-700">Gehalt & SV</h4>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Stundenlohn (€)" name="hourly_rate" type="number" step="0.01" defaultValue={employee.hourly_rate?.toString() || ''} />
            <Input label="Monatsgehalt (€)" name="monthly_salary" type="number" step="0.01" defaultValue={employee.monthly_salary?.toString() || ''} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Steuerklasse" name="tax_class" defaultValue={employee.tax_class || ''} />
            <Input label="SV-Nummer" name="social_security_number" defaultValue={employee.social_security_number || ''} />
          </div>
          <Input label="Krankenkasse" name="health_insurance" defaultValue={employee.health_insurance || ''} />
          <Input label="IBAN" name="iban" defaultValue={employee.iban || ''} />
          <h4 className="mt-2 font-medium text-slate-700">Notfallkontakt</h4>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Name" name="emergency_contact_name" defaultValue={employee.emergency_contact_name || ''} />
            <Input label="Telefon" name="emergency_contact_phone" defaultValue={employee.emergency_contact_phone || ''} />
            <Input label="Beziehung" name="emergency_contact_relation" defaultValue={employee.emergency_contact_relation || ''} />
          </div>
          <Input label="Urlaubstage/Jahr" name="annual_leave_days" type="number" defaultValue={String(employee.annual_leave_days || 30)} />
          {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
          <Button type="submit" disabled={pending}>{pending ? 'Speichern...' : 'Speichern'}</Button>
        </form>
      </Card>

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Sicherheitsunterweisungen</h3>
        {briefings.length > 0 && (
          <div className="mb-4 divide-y divide-slate-100 rounded-lg border border-slate-200">
            {briefings.map((b) => (
              <div key={b.id} className="px-3 py-2 text-sm">
                <p className="font-medium text-slate-900">{b.topic}</p>
                <p className="text-xs text-slate-500">
                  {new Date(b.briefing_date).toLocaleDateString('de-DE')}
                  {b.next_date && ` · Nächste: ${new Date(b.next_date).toLocaleDateString('de-DE')}`}
                </p>
              </div>
            ))}
          </div>
        )}
        <form action={bAction} className="flex flex-col gap-3 border-t border-slate-200 pt-4">
          <p className="text-sm font-medium text-slate-700">Neue Unterweisung</p>
          <Input label="Thema" name="topic" required error={bState?.errors?.topic?.[0]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Datum" name="briefing_date" type="date" required />
            <Input label="Nächster Termin" name="next_date" type="date" />
          </div>
          {bState?.message && <p className={`text-sm ${bState.success ? 'text-emerald-600' : 'text-red-600'}`}>{bState.message}</p>}
          <Button type="submit" disabled={bPending} size="sm">{bPending ? 'Hinzufügen...' : 'Unterweisung hinzufügen'}</Button>
        </form>
      </Card>
    </div>
  )
}

function QualificationsTab({ employee, qualifications }: { employee: ProfileExtended; qualifications: Qualification[] }) {
  const boundAdd = addQualification.bind(null, employee.id)
  const [state, action, pending] = useActionState<EmployeeState, FormData>(boundAdd, null)
  const now = new Date()
  const soon = new Date()
  soon.setDate(soon.getDate() + 30)

  return (
    <div className="flex flex-col gap-6">
      {qualifications.length > 0 && (
        <Card className="p-0">
          <div className="divide-y divide-slate-100">
            {qualifications.map((q) => {
              const expiry = q.expiry_date ? new Date(q.expiry_date) : null
              const isExpired = expiry && expiry < now
              const isExpiringSoon = expiry && !isExpired && expiry < soon
              return (
                <div key={q.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{q.name}</p>
                    <p className="text-xs text-slate-500">
                      {q.issued_date && `Ausgestellt: ${new Date(q.issued_date).toLocaleDateString('de-DE')}`}
                      {q.expiry_date && ` · Gültig bis: ${new Date(q.expiry_date).toLocaleDateString('de-DE')}`}
                    </p>
                  </div>
                  {isExpired && <span className="flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700"><X className="h-3 w-3" /> Abgelaufen</span>}
                  {isExpiringSoon && <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700"><AlertTriangle className="h-3 w-3" /> Bald</span>}
                  {!isExpired && !isExpiringSoon && expiry && <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700"><Check className="h-3 w-3" /> Gültig</span>}
                </div>
              )
            })}
          </div>
        </Card>
      )}
      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Neue Qualifikation</h3>
        <form action={action} className="flex flex-col gap-3">
          <Input label="Bezeichnung" name="name" required placeholder="z.B. Staplerschein, SCC, Ersthelfer" error={state?.errors?.name?.[0]} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ausgestellt am" name="issued_date" type="date" />
            <Input label="Gültig bis" name="expiry_date" type="date" />
          </div>
          <Input label="Notiz" name="notes" />
          {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
          <Button type="submit" disabled={pending}>{pending ? 'Hinzufügen...' : 'Qualifikation hinzufügen'}</Button>
        </form>
      </Card>
    </div>
  )
}

function LeaveTab({ employee, leaveRequests }: { employee: ProfileExtended; leaveRequests: LeaveRequest[] }) {
  const router = useRouter()
  const approvedDays = leaveRequests
    .filter((l) => l.type === 'vacation' && l.status === 'approved' && new Date(l.start_date).getFullYear() === new Date().getFullYear())
    .reduce((sum, l) => sum + l.days, 0)
  const remaining = (employee.annual_leave_days || 30) - approvedDays

  async function handleApproval(id: string, approved: boolean) {
    await approveLeaveRequest(id, approved)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-slate-900">{employee.annual_leave_days || 30}</p>
          <p className="text-xs text-slate-500">Jahresurlaub</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{approvedDays}</p>
          <p className="text-xs text-slate-500">Genommen</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold text-[#1e3a5f]">{remaining}</p>
          <p className="text-xs text-slate-500">Resturlaub</p>
        </Card>
      </div>

      {leaveRequests.length > 0 && (
        <Card className="p-0">
          <div className="divide-y divide-slate-100">
            {leaveRequests.map((l) => {
              const colors: Record<string, string> = { pending: 'bg-amber-100 text-amber-700', approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700' }
              const labels: Record<string, string> = { pending: 'Offen', approved: 'Genehmigt', rejected: 'Abgelehnt' }
              return (
                <div key={l.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {new Date(l.start_date).toLocaleDateString('de-DE')} – {new Date(l.end_date).toLocaleDateString('de-DE')}
                      <span className="ml-2 text-slate-500">({l.days} Tage)</span>
                    </p>
                    <p className="text-xs text-slate-500">
                      {{ vacation: 'Urlaub', sick: 'Krank', unpaid: 'Unbezahlt', special: 'Sonderurlaub' }[l.type]}
                      {l.notes && ` · ${l.notes}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[l.status]}`}>{labels[l.status]}</span>
                    {l.status === 'pending' && (
                      <>
                        <button onClick={() => handleApproval(l.id, true)} className="rounded p-1 text-emerald-600 hover:bg-emerald-50"><Check className="h-4 w-4" /></button>
                        <button onClick={() => handleApproval(l.id, false)} className="rounded p-1 text-red-600 hover:bg-red-50"><X className="h-4 w-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}

function SickTab({ employee, sickDays }: { employee: ProfileExtended; sickDays: SickDay[] }) {
  const boundAdd = addSickDay.bind(null, employee.id)
  const [state, action, pending] = useActionState<EmployeeState, FormData>(boundAdd, null)
  const thisYear = sickDays.filter((s) => new Date(s.start_date).getFullYear() === new Date().getFullYear())
  const totalDays = thisYear.reduce((sum, s) => sum + s.days, 0)

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4 text-center">
        <p className="text-2xl font-bold text-slate-900">{totalDays}</p>
        <p className="text-xs text-slate-500">Krankheitstage {new Date().getFullYear()}</p>
      </Card>

      {sickDays.length > 0 && (
        <Card className="p-0">
          <div className="divide-y divide-slate-100">
            {sickDays.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">
                    {new Date(s.start_date).toLocaleDateString('de-DE')} – {new Date(s.end_date).toLocaleDateString('de-DE')}
                    <span className="ml-2 text-slate-500">({s.days} Tage)</span>
                  </p>
                  {s.notes && <p className="text-xs text-slate-500">{s.notes}</p>}
                </div>
                {s.has_certificate && <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">AU vorhanden</span>}
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Krankheit erfassen</h3>
        <form action={action} className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            <Input label="Von" name="start_date" type="date" required />
            <Input label="Bis" name="end_date" type="date" required />
            <Input label="Tage" name="days" type="number" min="1" required />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="has_certificate" id="has_cert" className="h-4 w-4 rounded border-slate-300" />
            <label htmlFor="has_cert" className="text-sm text-slate-700">AU-Bescheinigung vorhanden</label>
          </div>
          <Input label="Notiz" name="notes" />
          {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
          <Button type="submit" disabled={pending}>{pending ? 'Erfassen...' : 'Krankheit erfassen'}</Button>
        </form>
      </Card>
    </div>
  )
}
