'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then(mod => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then(mod => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then(mod => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then(mod => mod.Popup),
  { ssr: false }
)

type SiteMarker = { id: string; name: string; address: string | null; lat: number; lng: number; workerCount: number }
type WorkerMarker = { id: string; name: string; site: string; since: string; lat: number; lng: number }

export function SiteMap({ sites, workers }: { sites: SiteMarker[]; workers: WorkerMarker[] }) {
  const [mounted, setMounted] = useState(false)
  const [showSites, setShowSites] = useState(true)
  const [showWorkers, setShowWorkers] = useState(true)

  useEffect(() => {
    setMounted(true)
    // Import leaflet CSS
    import('leaflet/dist/leaflet.css')
  }, [])

  if (!mounted) return <div className="h-[500px] rounded-2xl bg-slate-100 animate-pulse" />

  // Center on Germany
  const center = sites.length > 0 ? [sites[0].lat, sites[0].lng] as [number, number] : [51.1657, 10.4515] as [number, number]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3">
        <button
          onClick={() => setShowSites(!showSites)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${showSites ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}
        >
          <div className={`h-3 w-3 rounded-full ${showSites ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          Baustellen
        </button>
        <button
          onClick={() => setShowWorkers(!showWorkers)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${showWorkers ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}
        >
          <div className={`h-3 w-3 rounded-full ${showWorkers ? 'bg-blue-500' : 'bg-slate-300'}`} />
          Mitarbeiter
        </button>
      </div>

      <div className="h-[500px] rounded-2xl overflow-hidden border border-slate-200">
        <MapContainer center={center} zoom={10} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {showSites && sites.map(s => (
            <Marker key={s.id} position={[s.lat, s.lng]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{s.name}</p>
                  {s.address && <p className="text-slate-500">{s.address}</p>}
                  <p className="text-blue-600">{s.workerCount} MA heute</p>
                  <a href={`/baustellen/${s.id}`} className="text-[#1e3a5f] underline">Details öffnen</a>
                </div>
              </Popup>
            </Marker>
          ))}
          {showWorkers && workers.map(w => (
            <Marker key={w.id} position={[w.lat, w.lng]}>
              <Popup>
                <div className="text-sm">
                  <p className="font-bold">{w.name}</p>
                  <p className="text-slate-500">{w.site}</p>
                  <p className="text-emerald-600">seit {w.since}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  )
}
