import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, MapPin, Calendar, Euro, Users, Clock, HardHat, BookOpen, Package } from 'lucide-react'
import { formatCurrency, formatNumber } from '@/lib/format'
import { EditSiteForm } from './edit-site-form'
import type { ConstructionSite, TimeEntry } from '@/lib/types'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktiv', color: 'bg-emerald-100 text-emerald-700' },
  paused: { label: 'Pausiert', color: 'bg-amber-100 text-amber-700' },
  completed: { label: 'Abgeschlossen', color: 'bg-slate-100 text-slate-600' },
}

export default async function SiteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab || 'overview'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/dashboard')

  // Fetch everything for this site
  const [
    { data: site },
    { data: timeEntries },
    { data: equipment },
    { data: diaryEntries },
    { data: orders },
    { data: foremen },
    { data: stockMovements },
  ] = await Promise.all([
    supabase.from('construction_sites').select('*').eq('id', id).single(),
    supabase.from('time_entries').select('*, profiles(first_name, last_name, hourly_rate)').eq('site_id', id).order('clock_in', { ascending: false }).limit(50),
    supabase.from('equipment').select('*').eq('assigned_site', id),
    supabase.from('diary_entries').select('*').eq('site_id', id).order('entry_date', { ascending: false }).limit(10),
    supabase.from('orders').select('id, title, status, budget').eq('site_id', id),
    supabase.from('profiles').select('id, first_name, last_name').in('role', ['owner', 'foreman']).order('last_name'),
    supabase.from('stock_movements').select('*, materials(name, unit)').eq('site_id', id).order('created_at', { ascending: false }).limit(20),
  ])

  if (!site) notFound()
  const s = site as ConstructionSite
  const status = STATUS_LABELS[s.status] || STATUS_LABELS.active

  // Fetch site manager name if set
  let managerName: string | null = null
  if (s.site_manager) {
    const { data: mgr } = await supabase.from('profiles').select('first_name, last_name').eq('id', s.site_manager).single()
    if (mgr) managerName = `${mgr.first_name} ${mgr.last_name}`
  }

  // Calculate stats
  const totalHours = (timeEntries || []).reduce((sum: number, e: { clock_in: string; clock_out: string | null; break_minutes: number }) => {
    if (!e.clock_out) return sum
    return sum + Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - e.break_minutes / 60)
  }, 0)

  const laborCost = (timeEntries || []).reduce((sum: number, e: { clock_in: string; clock_out: string | null; break_minutes: number; profiles: { hourly_rate: number | null } | null }) => {
    if (!e.clock_out || !e.profiles?.hourly_rate) return sum
    const hours = Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - e.break_minutes / 60)
    return sum + hours * e.profiles.hourly_rate
  }, 0)

  const uniqueWorkers = new Set((timeEntries || []).map((e: { user_id: string }) => e.user_id))
  const currentlyClockedIn = (timeEntries || []).filter((e: { clock_out: string | null }) => !e.clock_out)
  const foremanList = (foremen || []).map((f: { id: string; first_name: string; last_name: string }) => ({ id: f.id, name: `${f.first_name} ${f.last_name}` }))

  const TABS = [
    { id: 'overview', label: 'Übersicht' },
    { id: 'zeit', label: 'Zeiterfassung' },
    { id: 'geraete', label: 'Geräte' },
    { id: 'material', label: 'Material' },
    { id: 'tagebuch', label: 'Bautagebuch' },
    { id: 'edit', label: 'Bearbeiten' },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/baustellen" className="text-slate-500 hover:text-slate-900"><ChevronLeft className="h-5 w-5" /></Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{s.name}</h1>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
            {s.address && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{s.address}</span>}
            {s.start_date && <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(s.start_date).toLocaleDateString('de-DE')} – {s.end_date ? new Date(s.end_date).toLocaleDateString('de-DE') : 'offen'}</span>}
            {managerName && <span className="flex items-center gap-1"><HardHat className="h-3.5 w-3.5" />{managerName}</span>}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        <Card className="p-4 text-center">
          <Clock className="mx-auto mb-1 h-5 w-5 text-[#1e3a5f]" />
          <p className="text-xl font-bold text-slate-900">{Math.round(totalHours * 10) / 10}h</p>
          <p className="text-xs text-slate-500">Gesamtstunden</p>
        </Card>
        <Card className="p-4 text-center">
          <Euro className="mx-auto mb-1 h-5 w-5 text-emerald-600" />
          <p className="text-xl font-bold text-slate-900">{formatCurrency(laborCost)}</p>
          <p className="text-xs text-slate-500">Personalkosten</p>
        </Card>
        <Card className="p-4 text-center">
          <Users className="mx-auto mb-1 h-5 w-5 text-blue-600" />
          <p className="text-xl font-bold text-slate-900">{uniqueWorkers.size}</p>
          <p className="text-xs text-slate-500">Mitarbeiter</p>
        </Card>
        <Card className="p-4 text-center">
          <Package className="mx-auto mb-1 h-5 w-5 text-amber-600" />
          <p className="text-xl font-bold text-slate-900">{(equipment || []).length}</p>
          <p className="text-xs text-slate-500">Geräte vor Ort</p>
        </Card>
        <Card className="p-4 text-center">
          <BookOpen className="mx-auto mb-1 h-5 w-5 text-violet-600" />
          <p className="text-xl font-bold text-slate-900">{(diaryEntries || []).length}</p>
          <p className="text-xs text-slate-500">Tagebucheinträge</p>
        </Card>
      </div>

      {/* Currently clocked in */}
      {currentlyClockedIn.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-medium text-emerald-700">
            {currentlyClockedIn.length} Mitarbeiter aktuell eingestempelt:
            {currentlyClockedIn.map((e: { profiles: { first_name: string; last_name: string } | null }, i: number) => (
              <span key={i}>{i > 0 ? ', ' : ' '}{e.profiles?.first_name} {e.profiles?.last_name}</span>
            ))}
          </p>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1">
        {TABS.map(t => (
          <Link key={t.id} href={`?tab=${t.id}`}
            className={`whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors ${activeTab === t.id ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >{t.label}</Link>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Client info */}
          {(s.client_name || s.description) && (
            <Card>
              <h3 className="mb-3 text-lg font-semibold text-slate-900">Projekt-Info</h3>
              {s.description && <p className="mb-3 text-sm text-slate-600">{s.description}</p>}
              {s.client_name && (
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt className="text-slate-500">Auftraggeber</dt><dd className="font-medium text-slate-900">{s.client_name}</dd></div>
                  {s.client_phone && <div className="flex justify-between"><dt className="text-slate-500">Telefon</dt><dd>{s.client_phone}</dd></div>}
                  {s.client_email && <div className="flex justify-between"><dt className="text-slate-500">E-Mail</dt><dd>{s.client_email}</dd></div>}
                </dl>
              )}
              {s.budget && (
                <div className="mt-3 border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Budget</span>
                    <span className="font-bold text-slate-900">{formatCurrency(Number(s.budget))}</span>
                  </div>
                  {Number(s.budget) > 0 && (
                    <div className="mt-2">
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className={`h-full rounded-full transition-all ${laborCost / Number(s.budget) >= 0.8 ? 'bg-red-500' : laborCost / Number(s.budget) >= 0.5 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(100, (laborCost / Number(s.budget)) * 100)}%` }} />
                      </div>
                      <p className="mt-1 text-xs text-slate-400">{Math.round((laborCost / Number(s.budget)) * 100)}% des Budgets für Personalkosten</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}

          {/* Linked orders */}
          <Card>
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Verknüpfte Aufträge</h3>
            {(!orders || orders.length === 0) ? (
              <p className="text-sm text-slate-500">Keine Aufträge verknüpft</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((o: { id: string; title: string; status: string; budget: number | null }) => (
                  <Link key={o.id} href={`/auftraege/${o.id}`} className="flex items-center justify-between py-2.5 hover:bg-slate-50 rounded-lg px-2 transition-colors">
                    <span className="text-sm font-medium text-slate-900">{o.title}</span>
                    <span className="text-xs text-slate-500">{o.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {s.notes && (
            <Card className="lg:col-span-2">
              <h3 className="mb-2 text-lg font-semibold text-slate-900">Notizen</h3>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{s.notes}</p>
            </Card>
          )}

          {/* QR Code */}
          <Card className="lg:col-span-2">
            <h3 className="mb-3 text-lg font-semibold text-slate-900">Einstempeln QR-Code</h3>
            {(() => {
              const stempelUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.buildtime.de'}/stempeln?site=${s.id}`
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(stempelUrl)}`
              return (
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <img src={qrUrl} alt="QR-Code zum Einstempeln" width={200} height={200} className="rounded-lg border border-slate-200" />
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-slate-600">
                      Drucken Sie diesen QR-Code aus und hängen Sie ihn auf der Baustelle auf. Ihre Mitarbeiter können ihn scannen um direkt einzustempeln.
                    </p>
                    <a
                      href={qrUrl}
                      download={`qr-${s.name.replace(/\s+/g, '-')}.png`}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors w-fit"
                    >
                      QR-Code herunterladen
                    </a>
                    <p className="text-xs text-slate-400 font-mono break-all">{stempelUrl}</p>
                  </div>
                </div>
              )
            })()}
          </Card>
        </div>
      )}

      {activeTab === 'zeit' && (
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Zeiteinträge auf dieser Baustelle</h3>
          {(!timeEntries || timeEntries.length === 0) ? (
            <p className="text-sm text-slate-500">Keine Zeiteinträge</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {(timeEntries as (TimeEntry & { profiles: { first_name: string; last_name: string; hourly_rate: number | null } | null })[]).map(e => {
                const hours = e.clock_out ? Math.max(0, (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - e.break_minutes / 60) : 0
                return (
                  <div key={e.id} className="flex items-center justify-between py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-slate-900">{e.profiles?.first_name} {e.profiles?.last_name}</p>
                      <p className="text-xs text-slate-500">
                        {new Date(e.clock_in).toLocaleDateString('de-DE')} · {new Date(e.clock_in).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                        {e.clock_out ? ` – ${new Date(e.clock_out).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}` : ' – läuft'}
                        {e.break_minutes > 0 && ` · ${e.break_minutes}min Pause`}
                      </p>
                    </div>
                    <span className="font-medium text-slate-700">{e.clock_out ? `${formatNumber(hours, 1)}h` : '–'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'geraete' && (
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Geräte auf dieser Baustelle</h3>
          {(!equipment || equipment.length === 0) ? (
            <p className="text-sm text-slate-500">Keine Geräte zugewiesen</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {equipment.map((eq: { id: string; name: string; category: string; status: string }) => (
                <Link key={eq.id} href={`/fuhrpark/geraet/${eq.id}`} className="flex items-center justify-between py-2.5 hover:bg-slate-50 rounded-lg px-2 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{eq.name}</p>
                    <p className="text-xs text-slate-500">{{ heavy: 'Baumaschine', power_tool: 'Elektrowerkzeug', tool: 'Werkzeug', safety: 'Sicherheit', other: 'Sonstiges' }[eq.category]}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${{ available: 'bg-emerald-100 text-emerald-700', in_use: 'bg-blue-100 text-blue-700', maintenance: 'bg-amber-100 text-amber-700', defect: 'bg-red-100 text-red-700', disposed: 'bg-slate-100 text-slate-600' }[eq.status] || 'bg-slate-100 text-slate-600'}`}>
                    {{ available: 'Verfügbar', in_use: 'Im Einsatz', maintenance: 'Wartung', defect: 'Defekt', disposed: 'Entsorgt' }[eq.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'material' && (
        <Card>
          <h3 className="mb-3 text-lg font-semibold text-slate-900">Materialverbrauch</h3>
          {(!stockMovements || stockMovements.length === 0) ? (
            <p className="text-sm text-slate-500">Keine Materialbewegungen für diese Baustelle</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {(stockMovements as ({ id: string; type: string; quantity: number; created_at: string; notes: string | null; materials: { name: string; unit: string } | null })[]).map(m => (
                <div key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <p className="font-medium text-slate-900">{m.materials?.name || 'Unbekannt'}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(m.created_at).toLocaleDateString('de-DE')}
                      {m.notes && ` · ${m.notes}`}
                    </p>
                  </div>
                  <span className={`font-medium ${m.type === 'out' ? 'text-red-600' : 'text-emerald-600'}`}>
                    {m.type === 'out' ? '-' : '+'}{m.quantity} {m.materials?.unit || 'Stk'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {activeTab === 'tagebuch' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Bautagebuch</h3>
            <Link href={`/bautagebuch/neu?site=${id}`}>
              <Button size="sm">Neuer Eintrag</Button>
            </Link>
          </div>
          {(!diaryEntries || diaryEntries.length === 0) ? (
            <Card className="py-8 text-center text-sm text-slate-500">Keine Tagebucheinträge</Card>
          ) : (
            diaryEntries.map((d: { id: string; entry_date: string; weather: string | null; temperature: number | null; work_description: string; incidents: string | null; defects: string | null }) => (
              <Link key={d.id} href={`/bautagebuch/${d.id}`}>
                <Card className="hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-slate-900">{new Date(d.entry_date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                    {d.weather && <span className="text-sm text-slate-500">{d.weather} {d.temperature && `${d.temperature}°C`}</span>}
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{d.work_description}</p>
                  {(d.incidents || d.defects) && (
                    <div className="mt-2 flex gap-2">
                      {d.incidents && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">Vorkommnisse</span>}
                      {d.defects && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700">Mängel</span>}
                    </div>
                  )}
                </Card>
              </Link>
            ))
          )}
        </div>
      )}

      {activeTab === 'edit' && (
        <Card className="max-w-2xl">
          <EditSiteForm site={s} foremen={foremanList} />
        </Card>
      )}
    </div>
  )
}
