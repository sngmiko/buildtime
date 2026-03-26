import { describe, it, expect } from 'vitest'
import { companySchema, profileSchema } from '@/lib/validations/company'

describe('companySchema', () => {
  it('accepts valid company data', () => {
    const result = companySchema.safeParse({
      name: 'Bau GmbH',
      address: 'Hauptstraße 1, 10115 Berlin',
      tax_id: 'DE123456789',
      trade_license: 'HWK-12345',
    })
    expect(result.success).toBe(true)
  })

  it('accepts company with only name', () => {
    const result = companySchema.safeParse({
      name: 'Bau GmbH',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = companySchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('profileSchema', () => {
  it('accepts valid profile data', () => {
    const result = profileSchema.safeParse({
      first_name: 'Max',
      last_name: 'Mustermann',
      phone: '+49 170 1234567',
    })
    expect(result.success).toBe(true)
  })

  it('accepts profile without phone', () => {
    const result = profileSchema.safeParse({
      first_name: 'Max',
      last_name: 'Mustermann',
    })
    expect(result.success).toBe(true)
  })
})
