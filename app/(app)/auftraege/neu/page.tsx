import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { OrderForm } from './order-form'
import type { Customer, ConstructionSite } from '@/lib/types'

export default async function AuftragNeuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/stempeln')

  const [{ data: customers }, { data: sites }] = await Promise.all([
    supabase.from('customers').select('*').order('name'),
    supabase.from('construction_sites').select('id, name').eq('status', 'active').order('name'),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/auftraege" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Neuer Auftrag</h1>
          <p className="text-sm text-slate-500">Auftrag oder Angebot erstellen</p>
        </div>
      </div>

      <Card className="max-w-xl">
        <OrderForm
          customers={(customers as Customer[]) || []}
          sites={(sites as ConstructionSite[]) || []}
        />
      </Card>
    </div>
  )
}
