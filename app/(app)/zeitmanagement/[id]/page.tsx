import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { EntryEditForm } from '@/components/time/entry-edit-form'
import type { TimeEntry, ConstructionSite } from '@/lib/types'

export default async function EditEntryPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ period?: string; offset?: string; user?: string }>
}) {
  const { id } = await params
  const sp = await searchParams

  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['owner', 'foreman'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const { data: entry } = await supabase
    .from('time_entries')
    .select('*')
    .eq('id', id)
    .single()

  if (!entry) notFound()

  const { data: sites } = await supabase
    .from('construction_sites')
    .select('*')
    .order('name')

  const backUrl = `/zeitmanagement?period=${sp.period || 'week'}&offset=${sp.offset || '0'}&user=${sp.user || ''}`

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href={backUrl} className="text-sm text-slate-500 hover:text-slate-900">
          Zeitmanagement
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-2xl font-bold text-slate-900">Eintrag bearbeiten</h1>
      </div>
      <Card className="max-w-lg">
        <EntryEditForm
          entry={entry as TimeEntry}
          sites={(sites as ConstructionSite[]) || []}
        />
      </Card>
    </div>
  )
}
