import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { EditSiteForm } from './edit-site-form'
import type { ConstructionSite } from '@/lib/types'

export default async function EditSitePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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

  const { data: site } = await supabase
    .from('construction_sites')
    .select('*')
    .eq('id', id)
    .single()

  if (!site) notFound()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/baustellen" className="text-sm text-slate-500 hover:text-slate-900">
          Baustellen
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-2xl font-bold text-slate-900">{(site as ConstructionSite).name}</h1>
      </div>
      <Card className="max-w-lg">
        <EditSiteForm site={site as ConstructionSite} />
      </Card>
    </div>
  )
}
