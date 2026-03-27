import { Card } from './card'
import type { LucideIcon } from 'lucide-react'

export function StatCard({
  label,
  value,
  subtitle,
  icon: Icon,
  color = 'text-[#f59e0b]',
  bg = 'bg-blue-500/10',
}: {
  label: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  color?: string
  bg?: string
}) {
  return (
    <Card className="flex items-center gap-4 p-5" hover>
      {Icon && (
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${bg}`}>
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      )}
      <div>
        <p className="text-2xl font-bold text-slate-100" style={{ animation: 'countUp 0.5s ease-out' }}>{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
        {subtitle && <p className="text-[10px] text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
    </Card>
  )
}
