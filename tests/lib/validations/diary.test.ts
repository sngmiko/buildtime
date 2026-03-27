import { describe, it, expect } from 'vitest'
import { diaryEntrySchema } from '@/lib/validations/diary'

describe('diaryEntrySchema', () => {
  it('accepts valid diary entry', () => {
    expect(diaryEntrySchema.safeParse({
      site_id: '550e8400-e29b-41d4-a716-446655440000',
      entry_date: '2026-03-26',
      work_description: 'Beton gegossen, Schalung entfernt',
    }).success).toBe(true)
  })

  it('rejects missing site_id', () => {
    expect(diaryEntrySchema.safeParse({
      entry_date: '2026-03-26',
      work_description: 'Arbeit geleistet',
    }).success).toBe(false)
  })

  it('rejects missing work_description', () => {
    expect(diaryEntrySchema.safeParse({
      site_id: '550e8400-e29b-41d4-a716-446655440000',
      entry_date: '2026-03-26',
      work_description: '',
    }).success).toBe(false)
  })

  it('accepts all optional weather fields', () => {
    expect(diaryEntrySchema.safeParse({
      site_id: '550e8400-e29b-41d4-a716-446655440000',
      entry_date: '2026-03-26',
      weather: 'Sonnig',
      temperature: 22,
      wind: 'leicht',
      work_description: 'Maurerarbeiten',
      incidents: 'Keine',
      defects: '',
      hindrances: 'Lieferverzögerung Material',
    }).success).toBe(true)
  })

  it('rejects temperature outside valid range', () => {
    expect(diaryEntrySchema.safeParse({
      site_id: 'abc',
      entry_date: '2026-03-26',
      work_description: 'Test',
      temperature: 100,
    }).success).toBe(false)
  })
})
