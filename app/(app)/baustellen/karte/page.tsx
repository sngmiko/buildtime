import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SiteMap } from '@/components/maps/site-map'

export default async function BaustellenKartePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: sites }, { data: clockedIn }] = await Promise.all([
    supabase.from('construction_sites').select('id, name, address, latitude, longitude, status').eq('status', 'active'),
    supabase.from('time_entries').select('user_id, clock_in, clock_in_lat, clock_in_lng, profiles(first_name, last_name), construction_sites(name)').is('clock_out', null),
  ])

  // Filter sites with coordinates
  const siteMarkers = (sites || []).filter((s: { latitude: number | null }) => s.latitude).map((s: { id: string; name: string; address: string | null; latitude: number; longitude: number }) => ({
    id: s.id, name: s.name, address: s.address, lat: s.latitude, lng: s.longitude, workerCount: 0,
  }))

  const workerMarkers = (clockedIn || []).filter((e: { clock_in_lat: number | null }) => e.clock_in_lat).map((e: { user_id: string; clock_in: string; clock_in_lat: number; clock_in_lng: number; profiles: { first_name: string; last_name: string } | null; construction_sites: { name: string } | null }) => ({
    id: e.user_id, name: `${e.profiles?.first_name} ${e.profiles?.last_name}`, site: e.construction_sites?.name || '', since: new Date(e.clock_in).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }), lat: e.clock_in_lat, lng: e.clock_in_lng,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Baustellen-Karte</h1>
        <Link href="/baustellen" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">← Zur Liste</Link>
      </div>
      <SiteMap sites={siteMarkers} workers={workerMarkers} />
    </div>
  )
}
