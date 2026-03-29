import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { DiaryEntryForm } from './diary-entry-form'
import type { ConstructionSite } from '@/lib/types'

export default async function BautagebuchNeuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) redirect('/stempeln')

  const { data: sites } = await supabase
    .from('construction_sites')
    .select('id, name')
    .eq('status', 'active')
    .order('name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/bautagebuch" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Neuer Tagebucheintrag</h1>
          <p className="text-sm text-slate-500">Bautagesbericht erfassen</p>
        </div>
      </div>

      <Card className="max-w-xl">
        <DiaryEntryForm sites={(sites as ConstructionSite[]) || []} />
      </Card>
    </div>
  )
}
