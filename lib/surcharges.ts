// German federal holidays + surcharge detection

function easterSunday(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export type HolidayInfo = { date: Date; name: string }

export function getGermanHolidays(year: number): HolidayInfo[] {
  const easter = easterSunday(year)
  return [
    { date: new Date(year, 0, 1), name: 'Neujahr' },
    { date: addDays(easter, -2), name: 'Karfreitag' },
    { date: addDays(easter, 1), name: 'Ostermontag' },
    { date: new Date(year, 4, 1), name: 'Tag der Arbeit' },
    { date: addDays(easter, 39), name: 'Christi Himmelfahrt' },
    { date: addDays(easter, 50), name: 'Pfingstmontag' },
    { date: new Date(year, 9, 3), name: 'Tag der Deutschen Einheit' },
    { date: new Date(year, 11, 25), name: '1. Weihnachtsfeiertag' },
    { date: new Date(year, 11, 26), name: '2. Weihnachtsfeiertag' },
  ]
}

function getHolidayMap(year: number): Map<string, string> {
  const map = new Map<string, string>()
  for (const h of getGermanHolidays(year)) {
    map.set(dateKey(h.date), h.name)
  }
  return map
}

export type SurchargeInfo = {
  isNight: boolean
  nightMinutes: number
  isWeekend: boolean
  isHoliday: boolean
  holidayName?: string
}

export function getSurcharges(clockIn: string, clockOut: string | null): SurchargeInfo {
  const start = new Date(clockIn)
  const end = clockOut ? new Date(clockOut) : new Date()

  const day = start.getDay()
  const isWeekend = day === 0 || day === 6

  const year = start.getFullYear()
  const holidays = getHolidayMap(year)
  const dk = dateKey(start)
  const holidayName = holidays.get(dk)
  const isHoliday = !!holidayName

  // Night minutes: count minutes between 23:00-06:00
  let nightMinutes = 0
  const cursor = new Date(start)
  while (cursor < end) {
    const hour = cursor.getHours()
    if (hour >= 23 || hour < 6) {
      nightMinutes++
    }
    cursor.setMinutes(cursor.getMinutes() + 1)
  }

  return {
    isNight: nightMinutes > 0,
    nightMinutes,
    isWeekend,
    isHoliday,
    holidayName,
  }
}
