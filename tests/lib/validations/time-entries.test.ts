import { describe, it, expect } from 'vitest'
import { clockInSchema, clockOutSchema, editEntrySchema } from '@/lib/validations/time-entries'

describe('clockInSchema', () => {
  it('accepts valid clock-in data', () => {
    const result = clockInSchema.safeParse({
      site_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing site_id', () => {
    const result = clockInSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects empty site_id', () => {
    const result = clockInSchema.safeParse({ site_id: '' })
    expect(result.success).toBe(false)
  })
})

describe('clockOutSchema', () => {
  it('accepts valid clock-out with break', () => {
    const result = clockOutSchema.safeParse({
      entry_id: '550e8400-e29b-41d4-a716-446655440000',
      break_minutes: 30,
    })
    expect(result.success).toBe(true)
  })

  it('accepts clock-out without break', () => {
    const result = clockOutSchema.safeParse({
      entry_id: '550e8400-e29b-41d4-a716-446655440000',
      break_minutes: 0,
    })
    expect(result.success).toBe(true)
  })

  it('accepts clock-out with notes', () => {
    const result = clockOutSchema.safeParse({
      entry_id: '550e8400-e29b-41d4-a716-446655440000',
      break_minutes: 45,
      notes: 'Regen-Pause',
    })
    expect(result.success).toBe(true)
  })

  it('rejects negative break minutes', () => {
    const result = clockOutSchema.safeParse({
      entry_id: '550e8400-e29b-41d4-a716-446655440000',
      break_minutes: -10,
    })
    expect(result.success).toBe(false)
  })

  it('rejects break over 480 minutes', () => {
    const result = clockOutSchema.safeParse({
      entry_id: '550e8400-e29b-41d4-a716-446655440000',
      break_minutes: 500,
    })
    expect(result.success).toBe(false)
  })
})

describe('editEntrySchema', () => {
  it('accepts valid edit data', () => {
    const result = editEntrySchema.safeParse({
      clock_in: '2026-03-26T07:00:00Z',
      clock_out: '2026-03-26T16:00:00Z',
      break_minutes: 45,
      site_id: '550e8400-e29b-41d4-a716-446655440000',
      notes: 'Korrigiert',
    })
    expect(result.success).toBe(true)
  })

  it('rejects missing clock_out', () => {
    const result = editEntrySchema.safeParse({
      clock_in: '2026-03-26T07:00:00Z',
      clock_out: '',
      break_minutes: 0,
      site_id: '550e8400-e29b-41d4-a716-446655440000',
    })
    expect(result.success).toBe(false)
  })
})
