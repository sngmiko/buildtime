import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { ChevronLeft } from 'lucide-react'
import { CreateEmployeeForm } from './create-form'

export default function MitarbeiterAnlegenPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/mitarbeiter" className="text-slate-500 hover:text-slate-900"><ChevronLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Mitarbeiter anlegen</h1>
          <p className="text-sm text-slate-500">Nur Name ist Pflicht. Account kann später zugewiesen werden.</p>
        </div>
      </div>
      <Card className="max-w-lg"><CreateEmployeeForm /></Card>
    </div>
  )
}
