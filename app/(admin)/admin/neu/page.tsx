import { Card } from '@/components/ui/card'
import { AdminCreateForm } from './create-form'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function AdminNeuPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-slate-500 hover:text-slate-900"><ChevronLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-900">Neue Firma anlegen</h1>
      </div>
      <Card className="max-w-lg"><AdminCreateForm /></Card>
    </div>
  )
}
