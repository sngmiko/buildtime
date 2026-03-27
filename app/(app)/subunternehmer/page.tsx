import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { TipBanner } from '@/components/ui/tip-banner'
import { getDismissedTips } from '@/actions/activity'
import { Plus, UsersRound, Star, AlertTriangle, Phone, Mail } from 'lucide-react'
import type { Subcontractor } from '@/lib/types'

function StarRating({ value, label }: { value: number | null; label: string }) {
  if (value === null) return null
  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-500">{label}:</span>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-3 w-3 ${i <= value ? 'fill-[#f59e0b] text-[#f59e0b]' : 'text-slate-200'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default async function SubunternehmerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman'].includes(profile.role)) redirect('/stempeln')

  const [{ data: subs }, dismissedTips] = await Promise.all([
    supabase.from('subcontractors').select('*').order('name'),
    getDismissedTips(),
  ])

  const now = new Date()
  const in30 = new Date()
  in30.setDate(in30.getDate() + 30)
  const in30Str = in30.toISOString().split('T')[0]
  const nowStr = now.toISOString().split('T')[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Subunternehmer</h1>
          <p className="mt-0.5 text-sm text-slate-500">{(subs || []).length} eingetragen</p>
        </div>
        <Link href="/subunternehmer/neu">
          <Button>
            <Plus className="h-4 w-4" />
            Neu anlegen
          </Button>
        </Link>
      </div>

      {subs && subs.length > 0 && subs.length <= 2 && (
        <TipBanner tipKey="subs_48b" dismissed={dismissedTips.has('subs_48b')}>
          Tipp: Hinterlegen Sie das Ablaufdatum der §48b-Freistellungsbescheinigung. BuildTime erinnert Sie 30 Tage vor Ablauf.
        </TipBanner>
      )}

      {(!subs || subs.length === 0) ? (
        <EmptyState
          icon={UsersRound}
          title="Ihre Subunternehmer"
          description="Verwalten Sie Nachunternehmer mit Kontaktdaten, Bewertungen und Freistellungsbescheinigungen (§48b). Rechnungen fließen automatisch in die Auftragskosten."
          actionLabel="Ersten Sub anlegen"
          actionHref="/subunternehmer/neu"
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(subs as Subcontractor[]).map((sub) => {
            const taxWarn = sub.tax_exemption_valid_until
              && sub.tax_exemption_valid_until <= in30Str
              && sub.tax_exemption_valid_until >= nowStr

            return (
              <Link key={sub.id} href={`/subunternehmer/${sub.id}`} className="block">
              <Card className="flex flex-col gap-3 hover:border-[#1e3a5f]/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{sub.name}</h3>
                    {sub.trade && (
                      <span className="inline-block mt-0.5 rounded-full bg-[#1e3a5f]/10 px-2 py-0.5 text-xs font-medium text-[#1e3a5f]">
                        {sub.trade}
                      </span>
                    )}
                  </div>
                  {taxWarn && (
                    <div className="shrink-0 flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                      <AlertTriangle className="h-3 w-3" />
                      Freistellung läuft ab
                    </div>
                  )}
                </div>

                {sub.contact_person && (
                  <p className="text-sm text-slate-600">{sub.contact_person}</p>
                )}

                <div className="flex flex-col gap-1">
                  {sub.phone && (
                    <a href={`tel:${sub.phone}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#1e3a5f]">
                      <Phone className="h-3 w-3" />
                      {sub.phone}
                    </a>
                  )}
                  {sub.email && (
                    <a href={`mailto:${sub.email}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-[#1e3a5f]">
                      <Mail className="h-3 w-3" />
                      {sub.email}
                    </a>
                  )}
                </div>

                {(sub.quality_rating !== null || sub.reliability_rating !== null || sub.price_rating !== null) && (
                  <div className="flex flex-col gap-0.5 border-t border-slate-100 pt-2">
                    <StarRating value={sub.quality_rating} label="Qualität" />
                    <StarRating value={sub.reliability_rating} label="Zuverlässigkeit" />
                    <StarRating value={sub.price_rating} label="Preis" />
                  </div>
                )}

                {sub.tax_exemption_valid_until && (
                  <p className={`text-xs ${taxWarn ? 'font-medium text-amber-700' : 'text-slate-500'}`}>
                    Freistellung bis: {new Date(sub.tax_exemption_valid_until).toLocaleDateString('de-DE')}
                  </p>
                )}
              </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
