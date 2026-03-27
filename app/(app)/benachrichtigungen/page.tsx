import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { generateNotifications } from '@/lib/queries/notifications'
import { AlertCircle, AlertTriangle, Info, Bell } from 'lucide-react'
import Link from 'next/link'

export default async function BenachrichtigungenPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const notifications = await generateNotifications(supabase, profile.company_id)

  const severityIcons: Record<string, typeof AlertCircle> = {
    critical: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }
  const severityColors: Record<string, string> = {
    critical: 'border-red-200 bg-red-50',
    warning: 'border-amber-200 bg-amber-50',
    info: 'border-blue-200 bg-blue-50',
  }
  const severityText: Record<string, string> = {
    critical: 'text-red-700',
    warning: 'text-amber-700',
    info: 'text-blue-700',
  }

  const critical = notifications.filter(n => n.severity === 'critical')
  const warnings = notifications.filter(n => n.severity === 'warning')
  const infos = notifications.filter(n => n.severity === 'info')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Bell className="h-6 w-6 text-[#1e3a5f]" />
        <h1 className="text-2xl font-bold text-slate-900">Benachrichtigungen</h1>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
          {notifications.length} aktiv
        </span>
      </div>

      {notifications.length === 0 ? (
        <Card className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50">
            <Bell className="h-8 w-8 text-emerald-500" />
          </div>
          <p className="text-slate-500">Keine aktiven Warnungen — alles im grünen Bereich!</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {critical.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-red-700">
                <AlertCircle className="h-4 w-4" /> Kritisch ({critical.length})
              </h2>
              <div className="space-y-2">
                {critical.map((n, i) => (
                  <Link key={i} href={n.link || '#'}>
                    <Card className={`border ${severityColors.critical} p-4 transition-shadow hover:shadow-md`}>
                      <p className={`text-sm font-medium ${severityText.critical}`}>{n.title}</p>
                      <p className="mt-1 text-xs text-red-600">{n.message}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {warnings.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-700">
                <AlertTriangle className="h-4 w-4" /> Warnungen ({warnings.length})
              </h2>
              <div className="space-y-2">
                {warnings.map((n, i) => (
                  <Link key={i} href={n.link || '#'}>
                    <Card className={`border ${severityColors.warning} p-4 transition-shadow hover:shadow-md`}>
                      <p className={`text-sm font-medium ${severityText.warning}`}>{n.title}</p>
                      <p className="mt-1 text-xs text-amber-600">{n.message}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {infos.length > 0 && (
            <div>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700">
                <Info className="h-4 w-4" /> Hinweise ({infos.length})
              </h2>
              <div className="space-y-2">
                {infos.map((n, i) => (
                  <Link key={i} href={n.link || '#'}>
                    <Card className={`border ${severityColors.info} p-4 transition-shadow hover:shadow-md`}>
                      <p className={`text-sm font-medium ${severityText.info}`}>{n.title}</p>
                      <p className="mt-1 text-xs text-blue-600">{n.message}</p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
