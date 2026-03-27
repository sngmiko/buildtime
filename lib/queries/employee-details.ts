import type { SupabaseClient } from '@supabase/supabase-js'

export async function getEmployeeFullDetails(supabase: SupabaseClient, employeeId: string) {
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1)
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)

  const [
    { data: profile },
    { data: weekEntries },
    { data: vehicle },
    { data: qualifications },
    { data: leaveRequests },
    { data: sickDays },
    { data: assignments },
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', employeeId).single(),
    supabase.from('time_entries').select('*, construction_sites(name)').eq('user_id', employeeId).gte('clock_in', weekStart.toISOString()).lte('clock_in', weekEnd.toISOString()).order('clock_in'),
    supabase.from('vehicles').select('*').eq('assigned_to', employeeId).limit(1).maybeSingle(),
    supabase.from('qualifications').select('*').eq('user_id', employeeId).order('expiry_date'),
    supabase.from('leave_requests').select('*').eq('user_id', employeeId).eq('status', 'approved').gte('end_date', new Date().toISOString()).order('start_date').limit(5),
    supabase.from('sick_days').select('*').eq('user_id', employeeId).gte('start_date', new Date(new Date().getFullYear(), 0, 1).toISOString()),
    supabase.from('order_assignments').select('*, orders(title, status)').eq('resource_type', 'employee').eq('resource_id', employeeId),
  ])

  // Calculate week hours
  const weekHours = (weekEntries || []).reduce((sum: number, e: { clock_in: string; clock_out: string | null; break_minutes: number }) => {
    if (!e.clock_out) return sum
    const hours = (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000 - e.break_minutes / 60
    return sum + Math.max(0, hours)
  }, 0)

  // Sites worked this week
  const sitesThisWeek = [...new Set((weekEntries || []).map((e: { construction_sites: { name: string } | null }) => e.construction_sites?.name).filter(Boolean))]

  // Expiring qualifications
  const thirtyDays = new Date()
  thirtyDays.setDate(thirtyDays.getDate() + 30)
  const expiringQuals = (qualifications || []).filter((q: { expiry_date: string | null }) => q.expiry_date && new Date(q.expiry_date) < thirtyDays)

  // Sick days this year
  const sickDaysCount = (sickDays || []).reduce((sum: number, s: { days: number }) => sum + s.days, 0)

  return {
    profile,
    weekEntries: weekEntries || [],
    vehicle,
    qualifications: qualifications || [],
    leaveRequests: leaveRequests || [],
    assignments: assignments || [],
    stats: {
      weekHours: Math.round(weekHours * 10) / 10,
      sitesThisWeek,
      expiringQuals,
      sickDaysThisYear: sickDaysCount,
    },
  }
}
