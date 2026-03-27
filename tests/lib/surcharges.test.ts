import { describe, it, expect } from 'vitest'
import { getGermanHolidays, getSurcharges } from '@/lib/surcharges'

describe('getGermanHolidays', () => {
  it('returns 9 federal holidays for 2026', () => {
    const holidays = getGermanHolidays(2026)
    expect(holidays).toHaveLength(9)
  })

  it('calculates Easter 2026 correctly (April 5)', () => {
    const holidays = getGermanHolidays(2026)
    const easter = holidays.find(h => h.name === 'Ostermontag')
    expect(easter).toBeDefined()
    // Easter Monday 2026 = April 6
    expect(easter!.date.getMonth()).toBe(3) // April = 3
    expect(easter!.date.getDate()).toBe(6)
  })

  it('has Karfreitag on April 3, 2026', () => {
    const holidays = getGermanHolidays(2026)
    const karfreitag = holidays.find(h => h.name === 'Karfreitag')
    expect(karfreitag!.date.getMonth()).toBe(3)
    expect(karfreitag!.date.getDate()).toBe(3)
  })

  it('has fixed holidays on correct dates', () => {
    const holidays = getGermanHolidays(2026)
    const names = holidays.map(h => h.name)
    expect(names).toContain('Neujahr')
    expect(names).toContain('Tag der Arbeit')
    expect(names).toContain('Tag der Deutschen Einheit')
    expect(names).toContain('1. Weihnachtsfeiertag')
    expect(names).toContain('2. Weihnachtsfeiertag')
  })
})

describe('getSurcharges', () => {
  it('detects normal daytime work', () => {
    const result = getSurcharges('2026-03-25T07:00:00', '2026-03-25T16:00:00')
    expect(result.isNight).toBe(false)
    expect(result.isWeekend).toBe(false)
    expect(result.isHoliday).toBe(false)
  })

  it('detects night work', () => {
    const result = getSurcharges('2026-03-25T22:00:00', '2026-03-26T06:00:00')
    expect(result.isNight).toBe(true)
    expect(result.nightMinutes).toBeGreaterThan(0)
  })

  it('detects weekend work (Saturday)', () => {
    // March 28, 2026 is a Saturday
    const result = getSurcharges('2026-03-28T08:00:00', '2026-03-28T16:00:00')
    expect(result.isWeekend).toBe(true)
  })

  it('detects weekend work (Sunday)', () => {
    // March 29, 2026 is a Sunday
    const result = getSurcharges('2026-03-29T08:00:00', '2026-03-29T16:00:00')
    expect(result.isWeekend).toBe(true)
  })

  it('detects holiday work', () => {
    // Jan 1, 2026 = Neujahr
    const result = getSurcharges('2026-01-01T08:00:00', '2026-01-01T16:00:00')
    expect(result.isHoliday).toBe(true)
    expect(result.holidayName).toBe('Neujahr')
  })

  it('handles weekday non-holiday correctly', () => {
    // March 25, 2026 is a Wednesday
    const result = getSurcharges('2026-03-25T08:00:00', '2026-03-25T16:00:00')
    expect(result.isWeekend).toBe(false)
    expect(result.isHoliday).toBe(false)
  })
})
