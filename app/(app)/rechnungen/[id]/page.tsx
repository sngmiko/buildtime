import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { ChevronLeft, Printer } from 'lucide-react'
import { formatCurrency } from '@/lib/format'
import { InvoiceActions } from './invoice-actions'
import type { Invoice, InvoiceItem, Customer, PaymentReminder } from '@/lib/types'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: 'Entwurf', color: 'bg-slate-100 text-slate-600' },
  sent: { label: 'Gesendet', color: 'bg-blue-100 text-blue-700' },
  paid: { label: 'Bezahlt', color: 'bg-emerald-100 text-emerald-700' },
  overdue: { label: 'Überfällig', color: 'bg-red-100 text-red-700' },
  cancelled: { label: 'Storniert', color: 'bg-slate-100 text-slate-500' },
}

type InvoiceWithCustomer = Invoice & { customers: Pick<Customer, 'name'> | null }

export default async function RechnungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/dashboard')

  const [{ data: invoice }, { data: items }, { data: reminders }] = await Promise.all([
    supabase.from('invoices').select('*, customers(name)').eq('id', id).single<InvoiceWithCustomer>(),
    supabase.from('invoice_items').select('*').eq('invoice_id', id).order('position') as unknown as Promise<{ data: InvoiceItem[] | null }>,
    supabase.from('payment_reminders').select('*').eq('invoice_id', id).order('reminder_level') as unknown as Promise<{ data: PaymentReminder[] | null }>,
  ])

  if (!invoice) notFound()

  const status = STATUS_LABELS[invoice.status] || STATUS_LABELS.draft
  const open = invoice.total - invoice.paid_amount

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link href="/rechnungen" className="text-slate-500 hover:text-slate-900">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{invoice.invoice_number}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
            </div>
            <p className="text-sm text-slate-500">
              {invoice.customers?.name}
              {' · '}
              Datum: {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}
              {invoice.due_date && ` · Fällig: ${new Date(invoice.due_date).toLocaleDateString('de-DE')}`}
            </p>
          </div>
        </div>
        <Link
          href={`/rechnungen/${id}/druck`}
          target="_blank"
          className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Printer className="h-4 w-4" />
          Als PDF drucken
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-5">
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-500">Netto</p>
          <p className="text-xl font-bold text-slate-900">
            {formatCurrency(invoice.subtotal)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-500">MwSt. ({invoice.tax_rate}%)</p>
          <p className="text-xl font-bold text-slate-700">
            {formatCurrency(invoice.tax_amount)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-500">Brutto</p>
          <p className="text-xl font-bold text-[#1e3a5f]">
            {formatCurrency(invoice.total)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-500">Bezahlt</p>
          <p className="text-xl font-bold text-emerald-600">
            {formatCurrency(invoice.paid_amount)}
          </p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-xs text-slate-500">Offen</p>
          <p className={`text-xl font-bold ${open > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatCurrency(open)}
          </p>
        </Card>
      </div>

      {/* Actions */}
      {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Aktionen</h2>
          <InvoiceActions invoiceId={id} status={invoice.status} />
        </Card>
      )}

      {/* Items table */}
      <Card>
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Positionen</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                <th className="pb-2 pr-4 font-medium">Pos.</th>
                <th className="pb-2 pr-4 font-medium">Beschreibung</th>
                <th className="pb-2 pr-4 font-medium text-right">Menge</th>
                <th className="pb-2 pr-4 font-medium text-right">EP</th>
                <th className="pb-2 font-medium text-right">GP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(items || []).map((item) => (
                <tr key={item.id}>
                  <td className="py-2.5 pr-4 text-slate-500">{item.position}</td>
                  <td className="py-2.5 pr-4 text-slate-900">{item.description}</td>
                  <td className="py-2.5 pr-4 text-right text-slate-700">{item.quantity} {item.unit}</td>
                  <td className="py-2.5 pr-4 text-right text-slate-700">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-slate-900">
                    {formatCurrency(item.total)}
                  </td>
                </tr>
              ))}
              {(!items || items.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-400">Keine Positionen</td>
                </tr>
              )}
            </tbody>
            <tfoot className="border-t border-slate-200">
              <tr>
                <td colSpan={4} className="pt-3 pr-4 text-right text-sm text-slate-500">Netto</td>
                <td className="pt-3 text-right text-sm font-medium text-slate-900">
                  {formatCurrency(invoice.subtotal)}
                </td>
              </tr>
              <tr>
                <td colSpan={4} className="py-1 pr-4 text-right text-sm text-slate-500">MwSt. {invoice.tax_rate}%</td>
                <td className="py-1 text-right text-sm font-medium text-slate-900">
                  {formatCurrency(invoice.tax_amount)}
                </td>
              </tr>
              <tr className="border-t border-slate-200">
                <td colSpan={4} className="pt-3 pr-4 text-right text-base font-semibold text-slate-900">Gesamt</td>
                <td className="pt-3 text-right text-base font-bold text-[#1e3a5f]">
                  {formatCurrency(invoice.total)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {/* Payment reminders */}
      {reminders && reminders.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Mahnungen</h2>
          <div className="flex flex-col gap-2">
            {reminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-red-800">{r.reminder_level}. Mahnung</p>
                  <p className="text-xs text-red-600">
                    Gesendet: {new Date(r.sent_date).toLocaleDateString('de-DE')}
                    {r.fee > 0 && ` · Mahngebühr: ${formatCurrency(r.fee)}`}
                  </p>
                </div>
                <p className="text-sm font-bold text-red-700">
                  {formatCurrency(r.due_amount)}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notes */}
      {invoice.notes && (
        <Card>
          <h2 className="mb-2 text-sm font-semibold text-slate-900">Hinweise</h2>
          <p className="text-sm text-slate-600">{invoice.notes}</p>
        </Card>
      )}
    </div>
  )
}
