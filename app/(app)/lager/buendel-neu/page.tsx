import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { BundleForm } from './bundle-form'
import type { Material } from '@/lib/types'

export default async function BuendelNeuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) redirect('/stempeln')

  const { data: materials } = await supabase.from('materials').select('*').order('name')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/lager?tab=buendel" className="text-sm text-slate-500 hover:text-slate-900">Lager & Einkauf</Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-2xl font-bold text-slate-900">Neues Bündel</h1>
      </div>
      <Card className="max-w-lg">
        <BundleForm materials={(materials as Material[]) || []} />
      </Card>
    </div>
  )
}
