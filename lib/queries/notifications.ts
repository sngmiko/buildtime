import type { SupabaseClient } from '@supabase/supabase-js'

export async function generateNotifications(supabase: SupabaseClient, companyId: string) {
  const notifications: { type: string; title: string; message: string; severity: string; link?: string }[] = []
  const thirtyDays = new Date()
  thirtyDays.setDate(thirtyDays.getDate() + 30)
  const now = new Date()

  // Expiring qualifications
  const { data: quals } = await supabase
    .from('qualifications')
    .select('*, profiles(first_name, last_name)')
    .lte('expiry_date', thirtyDays.toISOString())
    .gte('expiry_date', now.toISOString())

  for (const q of quals || []) {
    const p = q.profiles as { first_name: string; last_name: string } | null
    const days = Math.ceil((new Date(q.expiry_date).getTime() - now.getTime()) / 86400000)
    notifications.push({
      type: 'qualification_expiring',
      title: `${q.name} läuft ab`,
      message: `${p?.first_name} ${p?.last_name}: ${q.name} läuft in ${days} Tagen ab`,
      severity: days <= 7 ? 'critical' : 'warning',
      link: `/mitarbeiter/${q.user_id}?tab=qualifications`,
    })
  }

  // TÜV/Inspection
  const { data: vehicles } = await supabase
    .from('vehicles')
    .select('*')
    .lte('next_inspection', thirtyDays.toISOString())
    .gte('next_inspection', now.toISOString())

  for (const v of vehicles || []) {
    const days = Math.ceil((new Date(v.next_inspection).getTime() - now.getTime()) / 86400000)
    notifications.push({
      type: 'inspection_due',
      title: `TÜV fällig: ${v.license_plate}`,
      message: `${v.make} ${v.model} (${v.license_plate}) — TÜV in ${days} Tagen`,
      severity: days <= 7 ? 'critical' : 'warning',
      link: `/fuhrpark/fahrzeug/${v.id}`,
    })
  }

  // Budget warnings (orders at >80%)
  const { data: orders } = await supabase
    .from('orders')
    .select('id, title, budget')
    .in('status', ['in_progress', 'commissioned'])
    .not('budget', 'is', null)

  for (const o of orders || []) {
    if (!o.budget) continue
    const { data: costs } = await supabase.from('order_costs').select('amount').eq('order_id', o.id)
    const total = (costs || []).reduce((s: number, c: { amount: number }) => s + Number(c.amount), 0)
    const pct = (total / Number(o.budget)) * 100
    if (pct >= 80) {
      notifications.push({
        type: 'budget_warning',
        title: `Budget-Warnung: ${o.title}`,
        message: `${Math.round(pct)}% des Budgets erreicht (${total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} von ${Number(o.budget).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })})`,
        severity: pct >= 95 ? 'critical' : 'warning',
        link: `/auftraege/${o.id}?tab=costs`,
      })
    }
  }

  // Low stock
  const { data: materials } = await supabase
    .from('materials')
    .select('*')
    .not('min_stock', 'is', null)

  for (const m of materials || []) {
    if (m.current_stock !== null && m.min_stock !== null && m.current_stock < m.min_stock) {
      notifications.push({
        type: 'low_stock',
        title: `Niedriger Bestand: ${m.name}`,
        message: `${m.current_stock} ${m.unit} vorhanden, Minimum: ${m.min_stock} ${m.unit}`,
        severity: m.current_stock === 0 ? 'critical' : 'warning',
        link: '/lager',
      })
    }
  }

  // Tax exemption expiring
  const { data: subs } = await supabase
    .from('subcontractors')
    .select('*')
    .lte('tax_exemption_valid_until', thirtyDays.toISOString())
    .gte('tax_exemption_valid_until', now.toISOString())

  for (const s of subs || []) {
    const days = Math.ceil((new Date(s.tax_exemption_valid_until).getTime() - now.getTime()) / 86400000)
    notifications.push({
      type: 'tax_exemption_expiring',
      title: `§48b läuft ab: ${s.name}`,
      message: `Freistellungsbescheinigung von ${s.name} läuft in ${days} Tagen ab`,
      severity: days <= 7 ? 'critical' : 'warning',
      link: '/subunternehmer',
    })
  }

  // Pending leave requests
  const { count: pendingLeave } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  if (pendingLeave && pendingLeave > 0) {
    notifications.push({
      type: 'leave_pending',
      title: `${pendingLeave} offene Urlaubsanträge`,
      message: `${pendingLeave} Mitarbeiter warten auf Genehmigung ihres Urlaubsantrags`,
      severity: 'info',
      link: '/mitarbeiter',
    })
  }

  return notifications.sort((a, b) => {
    const sev = { critical: 0, warning: 1, info: 2 }
    return (sev[a.severity as keyof typeof sev] || 2) - (sev[b.severity as keyof typeof sev] || 2)
  })
}
