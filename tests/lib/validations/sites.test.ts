import { describe, it, expect } from 'vitest'
import { siteSchema } from '@/lib/validations/sites'

describe('siteSchema', () => {
  it('accepts valid site data', () => {
    const result = siteSchema.safeParse({
      name: 'Neubau Hauptstraße 5',
      address: 'Hauptstraße 5, 10115 Berlin',
      status: 'active',
    })
    expect(result.success).toBe(true)
  })

  it('accepts site with only name', () => {
    const result = siteSchema.safeParse({
      name: 'Baustelle A',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = siteSchema.safeParse({
      name: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = siteSchema.safeParse({
      name: 'Test',
      status: 'deleted',
    })
    expect(result.success).toBe(false)
  })

  it('accepts all valid statuses', () => {
    for (const status of ['active', 'completed', 'paused']) {
      const result = siteSchema.safeParse({ name: 'Test', status })
      expect(result.success).toBe(true)
    }
  })
})
