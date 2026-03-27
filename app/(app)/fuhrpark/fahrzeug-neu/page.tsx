import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { VehicleForm } from './vehicle-form'

export default function NeuFahrzeugPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/fuhrpark" className="text-sm text-slate-500 hover:text-slate-900">Fuhrpark</Link>
        <span className="text-slate-300">/</span>
        <h1 className="text-2xl font-bold text-slate-900">Neues Fahrzeug</h1>
      </div>
      <Card className="max-w-lg"><VehicleForm /></Card>
    </div>
  )
}
