import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ExportButtons } from './export-buttons'

export default async function ExportPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'super_admin'].includes(profile.role)) redirect('/dashboard')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Steuerberater-Export</h1>
        <p className="text-sm text-slate-500">Monatliche Stundennachweise und Lohnübersichten für Ihren Steuerberater</p>
      </div>

      <Card>
        <h3 className="mb-4 font-semibold text-slate-900">Monatsexport generieren</h3>
        <p className="mb-4 text-sm text-slate-500">Wählen Sie den Monat und laden Sie die Stundennachweise als CSV herunter. Die Datei enthält: Stunden, Nacht-/WE-/Feiertagsstunden, Bruttolohn, Urlaubstage und Krankheitstage pro Mitarbeiter.</p>
        <ExportButtons />
      </Card>

      <Card className="border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-700">
          💡 Automatischer E-Mail-Versand an Ihren Steuerberater kommt bald. Laden Sie den Export vorerst herunter und senden Sie ihn manuell.
        </p>
      </Card>
    </div>
  )
}
