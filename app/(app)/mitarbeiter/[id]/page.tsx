import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { EmployeeDetailTabs } from './employee-tabs'
import { calculateEmployeeCost } from '@/actions/employee'
import { ChevronLeft, Euro } from 'lucide-react'
import type { ProfileExtended, Qualification, SafetyBriefing, LeaveRequest, SickDay } from '@/lib/types'

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

  if (!currentProfile || !['owner', 'foreman'].includes(currentProfile.role)) {
    redirect('/dashboard')
  }

  const [
    { data: employee },
    { data: qualifications },
    { data: briefings },
    { data: leaveRequests },
    { data: sickDays },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('qualifications').select('*').eq('user_id', id).order('expiry_date'),
    supabase.from('safety_briefings').select('*').eq('user_id', id).order('briefing_date', { ascending: false }),
    supabase.from('leave_requests').select('*').eq('user_id', id).order('start_date', { ascending: false }),
    supabase.from('sick_days').select('*').eq('user_id', id).order('start_date', { ascending: false }),
  ])

  if (!employee) notFound()

  const costData = await calculateEmployeeCost(id)
  const typedEmployee = employee as ProfileExtended

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/mitarbeiter" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{typedEmployee.first_name} {typedEmployee.last_name}</h1>
          <p className="text-sm text-slate-500">
            {{ owner: 'Inhaber', foreman: 'Bauleiter', worker: 'Arbeiter' }[typedEmployee.role]}
            {typedEmployee.contract_type && ` · ${{ permanent: 'Festanstellung', temporary: 'Befristet', minijob: 'Minijob', intern: 'Praktikum' }[typedEmployee.contract_type]}`}
          </p>
        </div>
      </div>

      {costData && costData.monthlyGross > 0 && (
        <Card className="flex items-center gap-4 bg-slate-50 p-4">
          <Euro className="h-8 w-8 text-[#1e3a5f]" />
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <p className="text-xs text-slate-500">Brutto/Monat</p>
              <p className="font-semibold">{costData.monthlyGross.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">AG-Kosten</p>
              <p className="font-semibold">{costData.totalMonthly.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Effektiver Stundensatz</p>
              <p className="font-semibold text-[#1e3a5f]">{costData.effectiveHourlyRate.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}/h</p>
            </div>
          </div>
        </Card>
      )}

      <EmployeeDetailTabs
        employee={typedEmployee}
        qualifications={(qualifications as Qualification[]) || []}
        briefings={(briefings as SafetyBriefing[]) || []}
        leaveRequests={(leaveRequests as LeaveRequest[]) || []}
        sickDays={(sickDays as SickDay[]) || []}
        activeTab={tab || 'details'}
      />
    </div>
  )
}
