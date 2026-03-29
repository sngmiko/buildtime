import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { InvoiceForm } from './invoice-form'
import type { Customer, Order } from '@/lib/types'

export default async function RechnungNeuPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) redirect('/stempeln')

  const [{ data: customers }, { data: orders }] = await Promise.all([
    supabase.from('customers').select('*').order('name'),
    supabase.from('orders').select('id, title, customer_id').in('status', ['commissioned', 'in_progress', 'acceptance', 'completed']).order('title'),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/rechnungen" className="text-slate-500 hover:text-slate-900">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Neue Rechnung</h1>
          <p className="text-sm text-slate-500">Rechnung für einen Kunden erstellen</p>
        </div>
      </div>

      <Card className="max-w-xl">
        <InvoiceForm
          customers={(customers as Customer[]) || []}
          orders={(orders as Order[]) || []}
        />
      </Card>
    </div>
  )
}
