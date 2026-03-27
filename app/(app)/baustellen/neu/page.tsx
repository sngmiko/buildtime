import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { SiteForm } from './site-form'

export default function NeueBaustellePage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/baustellen" className="text-sm text-slate-500 hover:text-slate-900">
          Baustellen
        </Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-2xl font-bold text-slate-900">Neue Baustelle</h1>
      </div>
      <Card className="max-w-lg">
        <SiteForm />
      </Card>
    </div>
  )
}
