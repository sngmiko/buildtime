import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AutoPrint } from './auto-print'
import type { Invoice, InvoiceItem, Customer } from '@/lib/types'
import { formatNumber } from '@/lib/format'

type InvoiceWithCustomer = Invoice & { customers: (Pick<Customer, 'name' | 'address'> & { contact_person?: string | null }) | null }
type CompanyWithBank = {
  name: string
  address: string | null
  tax_id: string | null
  iban: string | null
  bic: string | null
  phone: string | null
  email: string | null
}

export default async function RechnungDruckPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, company_id').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/login')

  const [{ data: invoice }, { data: items }, { data: company }] = await Promise.all([
    supabase.from('invoices').select('*, customers(name, address, contact_person)').eq('id', id).single<InvoiceWithCustomer>(),
    supabase.from('invoice_items').select('*').eq('invoice_id', id).order('position') as unknown as Promise<{ data: InvoiceItem[] | null }>,
    supabase.from('companies').select('name, address, tax_id, iban, bic, phone, email').eq('id', profile.company_id).single<CompanyWithBank>(),
  ])

  if (!invoice) notFound()

  return (
    <>
      <AutoPrint />
      <div className="min-h-screen bg-white p-12 text-slate-900 print:p-8">
        {/* Company + Customer header */}
        <div className="mb-10 flex justify-between gap-8">
          <div>
            <h1 className="text-xl font-bold text-[#1e3a5f]">{company?.name}</h1>
            {company?.address && <p className="mt-1 text-sm text-slate-600 whitespace-pre-line">{company.address}</p>}
            {company?.phone && <p className="text-sm text-slate-600">Tel: {company.phone}</p>}
            {company?.email && <p className="text-sm text-slate-600">{company.email}</p>}
            {company?.tax_id && <p className="text-sm text-slate-600">St.-Nr.: {company.tax_id}</p>}
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-slate-900">{invoice.customers?.name}</p>
            {invoice.customers?.contact_person && (
              <p className="text-sm text-slate-600">{invoice.customers.contact_person}</p>
            )}
            {invoice.customers?.address && (
              <p className="mt-1 text-sm text-slate-600 whitespace-pre-line">{invoice.customers.address}</p>
            )}
          </div>
        </div>

        {/* Invoice meta */}
        <div className="mb-8 border-t border-slate-200 pt-6">
          <h2 className="text-2xl font-bold text-slate-900">Rechnung {invoice.invoice_number}</h2>
          <div className="mt-2 flex gap-8 text-sm text-slate-600">
            <span>Rechnungsdatum: {new Date(invoice.invoice_date).toLocaleDateString('de-DE')}</span>
            {invoice.due_date && (
              <span>Zahlungsziel: {new Date(invoice.due_date).toLocaleDateString('de-DE')}</span>
            )}
          </div>
        </div>

        {/* Items table */}
        <table className="mb-8 w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[#1e3a5f] text-left">
              <th className="pb-2 pr-4 font-semibold text-slate-900">Pos.</th>
              <th className="pb-2 pr-4 font-semibold text-slate-900">Beschreibung</th>
              <th className="pb-2 pr-4 text-right font-semibold text-slate-900">Menge</th>
              <th className="pb-2 pr-4 text-right font-semibold text-slate-900">Einh.</th>
              <th className="pb-2 pr-4 text-right font-semibold text-slate-900">EP (€)</th>
              <th className="pb-2 text-right font-semibold text-slate-900">GP (€)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {(items || []).map((item) => (
              <tr key={item.id}>
                <td className="py-2 pr-4 text-slate-500">{item.position}</td>
                <td className="py-2 pr-4 text-slate-900">{item.description}</td>
                <td className="py-2 pr-4 text-right text-slate-700">{item.quantity}</td>
                <td className="py-2 pr-4 text-right text-slate-700">{item.unit}</td>
                <td className="py-2 pr-4 text-right text-slate-700">
                  {formatNumber(item.unit_price, 2)}
                </td>
                <td className="py-2 text-right font-medium text-slate-900">
                  {formatNumber(item.total, 2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-200">
              <td colSpan={5} className="pt-3 pr-4 text-right text-slate-600">Nettobetrag</td>
              <td className="pt-3 text-right font-medium text-slate-900">
                {formatNumber(invoice.subtotal, 2)} €
              </td>
            </tr>
            <tr>
              <td colSpan={5} className="py-1 pr-4 text-right text-slate-600">zzgl. {invoice.tax_rate}% MwSt.</td>
              <td className="py-1 text-right font-medium text-slate-900">
                {formatNumber(invoice.tax_amount, 2)} €
              </td>
            </tr>
            <tr className="border-t-2 border-[#1e3a5f]">
              <td colSpan={5} className="pt-2 pr-4 text-right text-base font-bold text-slate-900">Gesamtbetrag</td>
              <td className="pt-2 text-right text-base font-bold text-[#1e3a5f]">
                {formatNumber(invoice.total, 2)} €
              </td>
            </tr>
          </tfoot>
        </table>

        {/* Payment terms */}
        <div className="mb-8 rounded-lg bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-medium">Zahlungsbedingungen</p>
          <p className="mt-1">
            Bitte überweisen Sie den Rechnungsbetrag bis zum{' '}
            {invoice.due_date
              ? new Date(invoice.due_date).toLocaleDateString('de-DE')
              : '14 Tage nach Rechnungsdatum'}{' '}
            unter Angabe der Rechnungsnummer {invoice.invoice_number} auf unser unten genanntes Konto.
          </p>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mb-8 text-sm text-slate-600">
            <p className="font-medium text-slate-800">Hinweise</p>
            <p className="mt-1">{invoice.notes}</p>
          </div>
        )}

        {/* Bank details */}
        <div className="border-t border-slate-200 pt-6 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Bankverbindung</p>
          <div className="mt-1 flex flex-col gap-0.5">
            <span>{company?.name}</span>
            {company?.iban && <span>IBAN: {company.iban}</span>}
            {company?.bic && <span>BIC: {company.bic}</span>}
          </div>
        </div>
      </div>
    </>
  )
}
