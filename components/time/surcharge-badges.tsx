import { Moon, Calendar, Star } from 'lucide-react'
import type { SurchargeInfo } from '@/lib/surcharges'

export function SurchargeBadges({ surcharges }: { surcharges: SurchargeInfo }) {
  if (!surcharges.isNight && !surcharges.isWeekend && !surcharges.isHoliday) {
    return null
  }

  return (
    <div className="flex gap-1.5">
      {surcharges.isNight && (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
          <Moon className="h-3 w-3" />
          Nacht
        </span>
      )}
      {surcharges.isWeekend && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
          <Calendar className="h-3 w-3" />
          WE
        </span>
      )}
      {surcharges.isHoliday && (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-medium text-rose-700" title={surcharges.holidayName}>
          <Star className="h-3 w-3" />
          Feiertag
        </span>
      )}
    </div>
  )
}
