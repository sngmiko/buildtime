import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'super_admin') redirect('/dashboard')

  return (
    <div className="flex flex-1 flex-col">
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-slate-900 px-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-amber-400" />
          <span className="text-lg font-bold text-white">BuildTime Admin</span>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/admin" className="text-slate-300 hover:text-white">Firmen</Link>
          <Link href="/admin/stats" className="text-slate-300 hover:text-white">Statistiken</Link>
          <Link href="/dashboard" className="text-slate-400 hover:text-white">← Zur App</Link>
        </div>
      </header>
      <main className="flex-1 bg-slate-50 p-6">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
