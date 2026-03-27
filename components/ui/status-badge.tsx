const PRESETS: Record<string, { label: string; className: string }> = {
  active: { label: 'Aktiv', className: 'bg-emerald-100 text-emerald-800 before:bg-emerald-500' },
  paused: { label: 'Pausiert', className: 'bg-amber-100 text-amber-800 before:bg-amber-500' },
  completed: { label: 'Abgeschlossen', className: 'bg-slate-100 text-slate-600 before:bg-slate-400' },
  draft: { label: 'Entwurf', className: 'bg-slate-100 text-slate-600 before:bg-slate-400' },
  sent: { label: 'Gesendet', className: 'bg-blue-100 text-blue-800 before:bg-blue-500' },
  paid: { label: 'Bezahlt', className: 'bg-emerald-100 text-emerald-800 before:bg-emerald-500' },
  overdue: { label: 'Überfällig', className: 'bg-red-100 text-red-800 before:bg-red-500 animate-pulse' },
  cancelled: { label: 'Storniert', className: 'bg-slate-100 text-slate-500 before:bg-slate-400' },
  available: { label: 'Verfügbar', className: 'bg-emerald-100 text-emerald-800 before:bg-emerald-500' },
  in_use: { label: 'Im Einsatz', className: 'bg-blue-100 text-blue-800 before:bg-blue-500' },
  maintenance: { label: 'Wartung', className: 'bg-amber-100 text-amber-800 before:bg-amber-500' },
  defect: { label: 'Defekt', className: 'bg-red-100 text-red-800 before:bg-red-500' },
  pending: { label: 'Offen', className: 'bg-amber-100 text-amber-800 before:bg-amber-500' },
  approved: { label: 'Genehmigt', className: 'bg-emerald-100 text-emerald-800 before:bg-emerald-500' },
  rejected: { label: 'Abgelehnt', className: 'bg-red-100 text-red-800 before:bg-red-500' },
  quote: { label: 'Angebot', className: 'bg-slate-100 text-slate-600 before:bg-slate-400' },
  commissioned: { label: 'Beauftragt', className: 'bg-blue-100 text-blue-800 before:bg-blue-500' },
  in_progress: { label: 'In Arbeit', className: 'bg-emerald-100 text-emerald-800 before:bg-emerald-500' },
  acceptance: { label: 'Abnahme', className: 'bg-amber-100 text-amber-800 before:bg-amber-500' },
  complaint: { label: 'Reklamation', className: 'bg-red-100 text-red-800 before:bg-red-500' },
}

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const preset = PRESETS[status]
  const displayLabel = label || preset?.label || status
  const cls = preset?.className || 'bg-slate-100 text-slate-600 before:bg-slate-400'

  return (
    <span className={`relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${cls} before:inline-block before:h-1.5 before:w-1.5 before:rounded-full before:content-['']`}>
      {displayLabel}
    </span>
  )
}
