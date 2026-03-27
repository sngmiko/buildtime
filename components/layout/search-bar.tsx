'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type SearchResult = { type: string; label: string; sublabel: string; href: string }

export function SearchBar() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!query || query.length < 2) { setResults([]); return }

    const timeout = setTimeout(async () => {
      setLoading(true)
      const supabase = createClient()
      const q = `%${query}%`
      const items: SearchResult[] = []

      const [{ data: profiles }, { data: orders }, { data: sites }, { data: vehicles }] = await Promise.all([
        supabase.from('profiles').select('id, first_name, last_name, role').or(`first_name.ilike.${q},last_name.ilike.${q}`).limit(5),
        supabase.from('orders').select('id, title, status').ilike('title', q).limit(5),
        supabase.from('construction_sites').select('id, name, status').ilike('name', q).limit(5),
        supabase.from('vehicles').select('id, license_plate, make, model').or(`license_plate.ilike.${q},make.ilike.${q}`).limit(5),
      ])

      for (const p of profiles || []) items.push({ type: 'Mitarbeiter', label: `${p.first_name} ${p.last_name}`, sublabel: p.role, href: `/mitarbeiter/${p.id}` })
      for (const o of orders || []) items.push({ type: 'Auftrag', label: o.title, sublabel: o.status, href: `/auftraege/${o.id}` })
      for (const s of sites || []) items.push({ type: 'Baustelle', label: s.name, sublabel: s.status, href: `/baustellen/${s.id}` })
      for (const v of vehicles || []) items.push({ type: 'Fahrzeug', label: v.license_plate, sublabel: `${v.make} ${v.model}`, href: `/fuhrpark/fahrzeug/${v.id}` })

      setResults(items)
      setLoading(false)
    }, 300)

    return () => clearTimeout(timeout)
  }, [query])

  function navigate(href: string) {
    setOpen(false)
    setQuery('')
    router.push(href)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-400 transition-colors hover:border-white/20 hover:text-slate-300 sm:flex"
      >
        <Search className="h-4 w-4" />
        Suche...
        <kbd className="ml-4 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">⌘K</kbd>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="relative z-10 w-full max-w-lg rounded-2xl bg-[#1a1a2e] border border-white/10 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Mitarbeiter, Aufträge, Baustellen suchen..."
            className="h-14 flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button onClick={() => setOpen(false)} className="rounded p-1 text-slate-400 hover:text-slate-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto p-2">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => navigate(r.href)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-white/5 transition-colors"
              >
                <span className="rounded bg-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">{r.type}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-100 truncate">{r.label}</p>
                  <p className="text-xs text-slate-400 truncate">{r.sublabel}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {query.length >= 2 && results.length === 0 && !loading && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Keine Ergebnisse</p>
        )}

        {loading && (
          <p className="px-4 py-6 text-center text-sm text-slate-400">Suche...</p>
        )}
      </div>
    </div>
  )
}
