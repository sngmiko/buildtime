import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { TipBanner } from '@/components/ui/tip-banner'
import { getDismissedTips } from '@/actions/activity'
import { Plus, FileText } from 'lucide-react'
import type { Invoice, Customer } from '@/lib/types'
import { formatCurrency } from '@/lib/format'

const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  sent: 'Gesendet',
  paid: 'Bezahlt',
  overdue: 'Überfällig',
  cancelled: 'Storniert',
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-100 text-blue-700',
  paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

type InvoiceWithCustomer = Invoice & { customers: Pick<Customer, 'name'> | null }

export default async function RechnungenPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const activeFilter = status || 'alle'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) redirect('/stempeln')

  let query = supabase
    .from('invoices')
    .select('*, customers(name)')
    .order('invoice_date', { ascending: false })

  if (activeFilter !== 'alle') {
    query = query.eq('status', activeFilter)
  }

  const [{ data: invoices }, dismissedTips] = await Promise.all([
    query,
    getDismissedTips(),
  ])

  const filters = [
    { key: 'alle', label: 'Alle' },
    { key: 'draft', label: 'Entwurf' },
    { key: 'sent', label: 'Gesendet' },
    { key: 'paid', label: 'Bezahlt' },
    { key: 'overdue', label: 'Überfällig' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Rechnungen</h1>
        <Link href="/rechnungen/neu">
          <Button>
            <Plus className="h-4 w-4" />
            Neue Rechnung
          </Button>
        </Link>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1">
        {filters.map(({ key, label }) => (
          <Link
            key={key}
            href={key === 'alle' ? '/rechnungen' : `?status=${key}`}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === key ? 'bg-[#1e3a5f] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {invoices && invoices.length > 0 && invoices.length <= 2 && (
        <TipBanner tipKey="invoices_from_order" dismissed={dismissedTips.has('invoices_from_order')}>
          Tipp: Sie können direkt aus einem Auftrag eine Rechnung generieren. Alle Positionen werden automatisch übernommen.
        </TipBanner>
      )}

      {/* Invoice list */}
      {(!invoices || invoices.length === 0) ? (
        <EmptyState
          icon={FileText}
          title="Ihre Rechnungen"
          description="Erstellen Sie professionelle Rechnungen direkt aus Ihren Aufträgen. Positionen, Steuersatz und Bankverbindung werden automatisch übernommen."
          actionLabel="Erste Rechnung erstellen"
          actionHref="/rechnungen/neu"
        />
      ) : (
        <div className="flex flex-col gap-3">
          {(invoices as InvoiceWithCustomer[]).map((invoice) => (
            <Link key={invoice.id} href={`/rechnungen/${invoice.id}`}>
              <Card className="transition-shadow hover:shadow-md cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{invoice.invoice_number}</h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[invoice.status] || STATUS_COLORS.draft}`}>
                        {STATUS_LABELS[invoice.status] || invoice.status}
                      </span>
                    </div>
                    {invoice.customers && (
                      <p className="text-sm text-slate-500 mt-0.5">{invoice.customers.name}</p>
                    )}
                    <div className="mt-1 flex gap-4 text-xs text-slate-400">
                      <span>Datum: {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</span>
                      {invoice.due_date && (
                        <span>Fällig: {new Date(invoice.due_date).toLocaleDateString('de-DE')}</span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(invoice.total)}
                    </p>
                    {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total && (
                      <p className="text-xs text-slate-500">
                        Offen: {formatCurrency(invoice.total - invoice.paid_amount)}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
