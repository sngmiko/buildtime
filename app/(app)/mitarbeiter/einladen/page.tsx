import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { InviteForm } from './invite-form'

export default function EinladenPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link
          href="/mitarbeiter"
          className="text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
        >
          Mitarbeiter
        </Link>
        <span className="text-zinc-300 dark:text-zinc-600">/</span>
        <h1 className="text-2xl font-bold">Einladen</h1>
      </div>
      <Card className="max-w-lg">
        <InviteForm />
      </Card>
    </div>
  )
}
