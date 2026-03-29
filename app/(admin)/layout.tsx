import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Shield, Building2, BarChart3, Settings, ArrowLeft, Users } from 'lucide-react'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, first_name').eq('id', user.id).single()
  if (!profile || profile.role !== 'super_admin') redirect('/dashboard')

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-700 bg-slate-900 px-6">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-amber-400" />
          <span className="text-lg font-bold text-white">NomadWorks</span>
          <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300">Admin</span>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400">Hallo, {profile.first_name}</span>
          <Link href="/dashboard" className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Zur App
          </Link>
        </div>
      </header>
      <div className="flex flex-1">
        <aside className="hidden w-56 flex-col border-r border-slate-200 bg-white p-3 md:flex">
          <nav className="flex flex-col gap-1">
            <AdminNavLink href="/admin" icon={Building2} label="Firmen" />
            <AdminNavLink href="/admin/users" icon={Users} label="Alle Benutzer" />
            <AdminNavLink href="/admin/stats" icon={BarChart3} label="Statistiken" />
            <AdminNavLink href="/admin/settings" icon={Settings} label="Einstellungen" />
          </nav>
          <div className="mt-auto border-t border-slate-200 pt-3 text-xs text-slate-400">
            Nomad Solutions Admin
          </div>
        </aside>
        <main className="flex-1 bg-slate-50 p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  )
}

function AdminNavLink({ href, icon: Icon, label }: { href: string; icon: typeof Building2; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  )
}
