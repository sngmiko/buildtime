import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { SupplierForm } from './supplier-form'

export default async function LieferantNeuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) redirect('/stempeln')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/lager?tab=lieferanten" className="text-sm text-slate-500 hover:text-slate-900">Lager & Einkauf</Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-2xl font-bold text-slate-900">Neuer Lieferant</h1>
      </div>
      <Card className="max-w-lg">
        <SupplierForm />
      </Card>
    </div>
  )
}
