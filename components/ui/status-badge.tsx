const PRESETS: Record<string, { label: string; className: string }> = {
  active: { label: 'Aktiv', className: 'bg-emerald-500/15 text-emerald-400 before:bg-emerald-400' },
  paused: { label: 'Pausiert', className: 'bg-amber-500/15 text-amber-400 before:bg-amber-400' },
  completed: { label: 'Abgeschlossen', className: 'bg-slate-500/15 text-slate-400 before:bg-slate-400' },
  draft: { label: 'Entwurf', className: 'bg-slate-500/15 text-slate-400 before:bg-slate-400' },
  sent: { label: 'Gesendet', className: 'bg-blue-500/15 text-blue-400 before:bg-blue-400' },
  paid: { label: 'Bezahlt', className: 'bg-emerald-500/15 text-emerald-400 before:bg-emerald-400' },
  overdue: { label: 'Überfällig', className: 'bg-red-500/15 text-red-400 before:bg-red-400 animate-pulse' },
  cancelled: { label: 'Storniert', className: 'bg-slate-500/15 text-slate-500 before:bg-slate-500' },
  available: { label: 'Verfügbar', className: 'bg-emerald-500/15 text-emerald-400 before:bg-emerald-400' },
  in_use: { label: 'Im Einsatz', className: 'bg-blue-500/15 text-blue-400 before:bg-blue-400' },
  maintenance: { label: 'Wartung', className: 'bg-amber-500/15 text-amber-400 before:bg-amber-400' },
  defect: { label: 'Defekt', className: 'bg-red-500/15 text-red-400 before:bg-red-400' },
  pending: { label: 'Offen', className: 'bg-amber-500/15 text-amber-400 before:bg-amber-400' },
  approved: { label: 'Genehmigt', className: 'bg-emerald-500/15 text-emerald-400 before:bg-emerald-400' },
  rejected: { label: 'Abgelehnt', className: 'bg-red-500/15 text-red-400 before:bg-red-400' },
  quote: { label: 'Angebot', className: 'bg-slate-500/15 text-slate-300 before:bg-slate-400' },
  commissioned: { label: 'Beauftragt', className: 'bg-blue-500/15 text-blue-400 before:bg-blue-400' },
  in_progress: { label: 'In Arbeit', className: 'bg-emerald-500/15 text-emerald-400 before:bg-emerald-400' },
  acceptance: { label: 'Abnahme', className: 'bg-amber-500/15 text-amber-400 before:bg-amber-400' },
  complaint: { label: 'Reklamation', className: 'bg-red-500/15 text-red-400 before:bg-red-400' },
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
