import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card } from '@/components/ui/card'
import { SiteForm } from './site-form'
import { ChevronLeft } from 'lucide-react'

export default async function NeueBaustellePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: foremen } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .in('role', ['owner', 'foreman'])
    .order('last_name')

  const foremanList = (foremen || []).map(f => ({ id: f.id, name: `${f.first_name} ${f.last_name}` }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link href="/baustellen" className="text-slate-500 hover:text-slate-900"><ChevronLeft className="h-5 w-5" /></Link>
        <h1 className="text-2xl font-bold text-slate-900">Neue Baustelle</h1>
      </div>
      <Card className="max-w-2xl"><SiteForm foremen={foremanList} /></Card>
    </div>
  )
}
