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
import { AlertTriangle, Check, X, Shield, FileText, Calendar, Thermometer, Clock, Briefcase } from 'lucide-react'
import { Tooltip } from '@/components/ui/tooltip'
import { formatNumber } from '@/lib/format'

const TABS = [
  { id: 'details', label: 'Stammdaten', icon: FileText },
  { id: 'qualifications', label: 'Qualifikationen', icon: Shield },
  { id: 'leave', label: 'Urlaub', icon: Calendar },
  { id: 'sick', label: 'Krankheit', icon: Thermometer },
  { id: 'activity', label: 'Aktivität', icon: Clock },
  { id: 'assignments', label: 'Aufträge', icon: Briefcase },
]

type EmployeeDetails = {
  profile: Record<string, unknown> | null
  weekEntries: Record<string, unknown>[]
  vehicle: Record<string, unknown> | null
  qualifications: Record<string, unknown>[]
  leaveRequests: Record<string, unknown>[]
  assignments: Record<string, unknown>[]
  stats: {
    weekHours: number
    sitesThisWeek: unknown[]
    expiringQuals: unknown[]
    sickDaysThisYear: number
  }
}

export function EmployeeDetailTabs({
  details,
  activeTab,
}: {
  details: EmployeeDetails
  activeTab: string
}) {
  const router = useRouter()
  const employee = details.profile as ProfileExtended

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

      {activeTab === 'details' && <DetailsTab employee={employee} details={details} />}
      {activeTab === 'qualifications' && <QualificationsTab employee={employee} qualifications={details.qualifications as unknown as Qualification[]} />}
      {activeTab === 'leave' && <LeaveTab employee={employee} leaveRequests={details.leaveRequests as unknown as LeaveRequest[]} />}
      {activeTab === 'sick' && <SickTab employee={employee} details={details} />}
      {activeTab === 'activity' && <ActivityTab details={details} />}
      {activeTab === 'assignments' && <AssignmentsTab details={details} />}
    </div>
  )
}

function DetailsTab({ employee, details }: { employee: ProfileExtended; details: EmployeeDetails }) {
  const boundUpdate = updateEmployeeDetails.bind(null, employee.id)
  const [state, action, pending] = useActionState<EmployeeState, FormData>(boundUpdate, null)

  // Fetch briefings from the profile's safety_briefings — not available in getEmployeeFullDetails,
  // so we show a note if none. For now render an empty briefings section.
  const briefings: SafetyBriefing[] = []

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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center">
                <label htmlFor="steuerklasse" className="text-sm font-medium text-slate-700">Steuerklasse</label>
                <Tooltip text="Steuerklasse 1-6. Bei Unsicherheit: Steuerklasse 1 (ledig) oder 4 (verheiratet)" />
              </div>
              <input
                id="steuerklasse"
                name="tax_class"
                defaultValue={employee.tax_class || ''}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center">
                <label htmlFor="sv-nummer" className="text-sm font-medium text-slate-700">SV-Nummer</label>
                <Tooltip text="Die Sozialversicherungsnummer steht auf dem SV-Ausweis, z.B. 12 010190 M 123" />
              </div>
              <input
                id="sv-nummer"
                name="social_security_number"
                defaultValue={employee.social_security_number || ''}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
              />
            </div>
          </div>
          <Input label="Krankenkasse" name="health_insurance" defaultValue={employee.health_insurance || ''} />
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center">
              <label htmlFor="iban" className="text-sm font-medium text-slate-700">IBAN</label>
              <Tooltip text="Für die Lohnüberweisung. Format: DE + 20 Ziffern" />
            </div>
            <input
              id="iban"
              name="iban"
              defaultValue={employee.iban || ''}
              className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20"
            />
          </div>
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

      <div className="flex flex-col gap-6">
        {/* Vehicle */}
        {details.vehicle && (
          <Card>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Zugewiesenes Fahrzeug</h3>
            <div className="text-sm space-y-1">
              <p className="font-medium text-slate-900">{(details.vehicle as Record<string, unknown>).make as string} {(details.vehicle as Record<string, unknown>).model as string}</p>
              <p className="text-slate-500">{(details.vehicle as Record<string, unknown>).license_plate as string}</p>
              {!!(details.vehicle as Record<string, unknown>).year && <p className="text-slate-500">Baujahr: {(details.vehicle as Record<string, unknown>).year as string}</p>}
            </div>
          </Card>
        )}

        {/* Safety briefings placeholder */}
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-slate-900">Sicherheitsunterweisungen</h3>
          {briefings.length === 0 ? (
            <p className="text-sm text-slate-400 mb-4">Keine Einträge</p>
          ) : null}
          <BriefingForm employeeId={employee.id} />
        </Card>
      </div>
    </div>
  )
}

function BriefingForm({ employeeId }: { employeeId: string }) {
  const boundBriefing = addBriefing.bind(null, employeeId)
  const [bState, bAction, bPending] = useActionState<EmployeeState, FormData>(boundBriefing, null)

  return (
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
          <div className="flex flex-col gap-1.5">
            <label htmlFor="qual-name" className="text-sm font-medium text-slate-700">Bezeichnung *</label>
            <input
              id="qual-name"
              list="qual-list"
              name="name"
              required
              placeholder="Qualifikation wählen oder eingeben..."
              className={`h-10 w-full rounded-lg border bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:border-[#1e3a5f] focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]/20 ${state?.errors?.name?.[0] ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20' : 'border-slate-300'}`}
            />
            <datalist id="qual-list">
              <option value="Staplerschein" />
              <option value="Ersthelfer" />
              <option value="SCC (Sicherheits-Zertifikat)" />
              <option value="Gerüstbau-Befähigung" />
              <option value="Schweißerschein" />
              <option value="Kranführerschein" />
              <option value="Baggerführerschein" />
              <option value="Motorsägen-Schein" />
              <option value="Asbest-Sachkunde (TRGS 519)" />
              <option value="Elektrofachkraft" />
              <option value="Höhenrettung" />
              <option value="Brandschutzhelfer" />
              <option value="Sicherheitsbeauftragter" />
              <option value="Führerschein Klasse C/CE" />
              <option value="ADR-Schein (Gefahrgut)" />
            </datalist>
            {state?.errors?.name?.[0] && <p className="text-sm text-red-600">{state.errors.name[0]}</p>}
          </div>
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

function SickTab({ employee, details }: { employee: ProfileExtended; details: EmployeeDetails }) {
  const boundAdd = addSickDay.bind(null, employee.id)
  const [state, action, pending] = useActionState<EmployeeState, FormData>(boundAdd, null)

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4 text-center">
        <p className="text-2xl font-bold text-slate-900">{details.stats.sickDaysThisYear}</p>
        <p className="text-xs text-slate-500">Krankheitstage {new Date().getFullYear()}</p>
      </Card>

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

function ActivityTab({ details }: { details: EmployeeDetails }) {
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <h3 className="mb-3 text-lg font-semibold text-slate-900">Zeiteinträge diese Woche</h3>
        {details.weekEntries.length === 0 ? (
          <p className="text-sm text-slate-500">Keine Zeiteinträge diese Woche</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {details.weekEntries.map((e) => {
              const entry = e as Record<string, unknown>
              const site = entry.construction_sites as { name: string } | null
              const clockIn = new Date(entry.clock_in as string)
              const clockOut = entry.clock_out ? new Date(entry.clock_out as string) : null
              const hours = clockOut
                ? Math.max(0, (clockOut.getTime() - clockIn.getTime()) / 3600000 - (entry.break_minutes as number) / 60)
                : null
              return (
                <div key={entry.id as string} className="flex items-center justify-between py-2 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">
                      {clockIn.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'numeric' })}
                    </p>
                    <p className="text-xs text-slate-500">
                      {clockIn.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                      {clockOut && ` – ${clockOut.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}`}
                      {site && ` · ${site.name}`}
                    </p>
                  </div>
                  <span className="font-medium text-slate-900">
                    {hours !== null ? `${formatNumber(hours, 1)}h` : <span className="text-amber-600 text-xs">läuft</span>}
                  </span>
                </div>
              )
            })}
            <div className="flex items-center justify-between py-2 text-sm font-bold">
              <span>Gesamt</span>
              <span className="text-[#1e3a5f]">{details.stats.weekHours}h</span>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function AssignmentsTab({ details }: { details: EmployeeDetails }) {
  const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    quote: { label: 'Angebot', color: 'bg-slate-100 text-slate-700' },
    commissioned: { label: 'Beauftragt', color: 'bg-blue-100 text-blue-700' },
    in_progress: { label: 'In Arbeit', color: 'bg-emerald-100 text-emerald-700' },
    acceptance: { label: 'Abnahme', color: 'bg-amber-100 text-amber-700' },
    completed: { label: 'Abgeschlossen', color: 'bg-slate-100 text-slate-600' },
    complaint: { label: 'Reklamation', color: 'bg-red-100 text-red-700' },
  }

  return (
    <div className="flex flex-col gap-4">
      {details.assignments.length === 0 ? (
        <Card className="py-8 text-center text-sm text-slate-500">Keine Auftragszuweisungen</Card>
      ) : (
        <Card className="p-0">
          <div className="divide-y divide-slate-100">
            {details.assignments.map((a) => {
              const assignment = a as Record<string, unknown>
              const order = assignment.orders as { title: string; status: string } | null
              const statusInfo = order ? (STATUS_LABELS[order.status] || STATUS_LABELS.quote) : null
              return (
                <div key={assignment.id as string} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{order?.title || 'Unbekannter Auftrag'}</p>
                    {!!assignment.notes && <p className="text-xs text-slate-500">{assignment.notes as string}</p>}
                  </div>
                  {statusInfo && (
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
