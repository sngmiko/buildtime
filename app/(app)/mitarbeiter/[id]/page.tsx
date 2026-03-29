import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getEmployeeFullDetails } from '@/lib/queries/employee-details'
import { Card } from '@/components/ui/card'
import { EmployeeDetailTabs } from './employee-tabs'
import { ChevronLeft, Clock, AlertTriangle, Car, Briefcase } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Inhaber',
  foreman: 'Bauleiter',
  worker: 'Arbeiter',
}

const CONTRACT_LABELS: Record<string, string> = {
  permanent: 'Festanstellung',
  temporary: 'Befristet',
  minijob: 'Minijob',
  intern: 'Praktikum',
}

export default async function EmployeeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { id } = await params
  const { tab } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentProfile || !['owner', 'foreman', 'super_admin'].includes(currentProfile.role)) {
    redirect('/dashboard')
  }

  const details = await getEmployeeFullDetails(supabase, id)
  if (!details.profile) notFound()

  const profile = details.profile as Record<string, unknown>
  const stats = details.stats

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/mitarbeiter" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{profile.first_name as string} {profile.last_name as string}</h1>
          <p className="text-sm text-slate-500">
            {ROLE_LABELS[profile.role as string] || (profile.role as string)}
            {!!profile.contract_type && ` · ${CONTRACT_LABELS[profile.contract_type as string] || (profile.contract_type as string)}`}
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="h-4 w-4 text-[#1e3a5f]" />
            <p className="text-xs text-slate-500">Stunden diese Woche</p>
          </div>
          <p className="text-2xl font-bold text-[#1e3a5f]">{stats.weekHours}h</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Briefcase className="h-4 w-4 text-slate-500" />
            <p className="text-xs text-slate-500">Aktive Aufträge</p>
          </div>
          <p className="text-2xl font-bold text-slate-900">{details.assignments.length}</p>
        </Card>
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Car className="h-4 w-4 text-slate-500" />
            <p className="text-xs text-slate-500">Fahrzeug</p>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            {details.vehicle ? `${(details.vehicle as Record<string, unknown>).make} ${(details.vehicle as Record<string, unknown>).model}` : '—'}
          </p>
        </Card>
        <Card className={`p-4 text-center ${stats.expiringQuals.length > 0 ? 'border-amber-200 bg-amber-50' : ''}`}>
          <div className="flex items-center justify-center gap-1 mb-1">
            <AlertTriangle className={`h-4 w-4 ${stats.expiringQuals.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
            <p className="text-xs text-slate-500">Ablaufende Quals.</p>
          </div>
          <p className={`text-2xl font-bold ${stats.expiringQuals.length > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{stats.expiringQuals.length}</p>
        </Card>
      </div>

      {/* Sick days / sites summary */}
      {(stats.sickDaysThisYear > 0 || stats.sitesThisWeek.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {stats.sickDaysThisYear > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="text-slate-500">Krankheitstage {new Date().getFullYear()}: </span>
              <span className="font-semibold text-slate-900">{stats.sickDaysThisYear}</span>
            </div>
          )}
          {stats.sitesThisWeek.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="text-slate-500">Baustellen diese Woche: </span>
              <span className="font-semibold text-slate-900">{(stats.sitesThisWeek as string[]).join(', ')}</span>
            </div>
          )}
        </div>
      )}

      <EmployeeDetailTabs
        details={details}
        activeTab={tab || 'details'}
      />
    </div>
  )
}
