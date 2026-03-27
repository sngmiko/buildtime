import Link from 'next/link'
import type { CompanyExtended } from '@/lib/types'

export function TrialBanner({ company }: { company: CompanyExtended }) {
  if (company.plan !== 'trial' || !company.trial_ends_at) return null

  const daysLeft = Math.max(0, Math.ceil((new Date(company.trial_ends_at).getTime() - Date.now()) / 86400000))
  const expired = daysLeft === 0

  if (expired) {
    return (
      <div className="bg-red-600 px-4 py-2 text-center text-sm font-medium text-white">
        Ihre Testphase ist abgelaufen.{' '}
        <Link href="/firma/abo" className="underline hover:no-underline">Jetzt upgraden</Link>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5f8a] px-4 py-2 text-center text-sm font-medium text-white">
      Noch {daysLeft} {daysLeft === 1 ? 'Tag' : 'Tage'} in der Testphase.{' '}
      <Link href="/firma/abo" className="underline hover:no-underline">Jetzt upgraden →</Link>
    </div>
  )
}
