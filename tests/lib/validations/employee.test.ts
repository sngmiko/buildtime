import { describe, it, expect } from 'vitest'
import { employeeDetailsSchema, qualificationSchema, leaveRequestSchema } from '@/lib/validations/employee'

describe('employeeDetailsSchema', () => {
  it('accepts valid employee data', () => {
    const result = employeeDetailsSchema.safeParse({
      first_name: 'Hans',
      last_name: 'Arbeiter',
      phone: '+49 170 1234567',
      address: 'Hauptstr. 1, 10115 Berlin',
      birth_date: '1985-05-15',
      nationality: 'Deutsch',
      contract_type: 'permanent',
      hourly_rate: 22.50,
      annual_leave_days: 30,
    })
    expect(result.success).toBe(true)
  })

  it('accepts minimal data (name only)', () => {
    const result = employeeDetailsSchema.safeParse({
      first_name: 'Hans',
      last_name: 'Arbeiter',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty first name', () => {
    const result = employeeDetailsSchema.safeParse({
      first_name: '',
      last_name: 'Test',
    })
    expect(result.success).toBe(false)
  })
})

describe('qualificationSchema', () => {
  it('accepts valid qualification', () => {
    const result = qualificationSchema.safeParse({
      name: 'Staplerschein',
      issued_date: '2024-01-15',
      expiry_date: '2027-01-15',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = qualificationSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })
})

describe('leaveRequestSchema', () => {
  it('accepts valid leave request', () => {
    const result = leaveRequestSchema.safeParse({
      start_date: '2026-07-01',
      end_date: '2026-07-14',
      days: 10,
      type: 'vacation',
    })
    expect(result.success).toBe(true)
  })

  it('rejects zero days', () => {
    const result = leaveRequestSchema.safeParse({
      start_date: '2026-07-01',
      end_date: '2026-07-01',
      days: 0,
      type: 'vacation',
    })
    expect(result.success).toBe(false)
  })
})
