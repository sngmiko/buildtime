import { describe, it, expect } from 'vitest'
import { subcontractorSchema, subAssignmentSchema } from '@/lib/validations/subcontractors'

describe('subcontractorSchema', () => {
  it('accepts valid subcontractor with name only', () => {
    expect(subcontractorSchema.safeParse({ name: 'Dachbau Müller GmbH' }).success).toBe(true)
  })

  it('rejects empty name', () => {
    expect(subcontractorSchema.safeParse({ name: '' }).success).toBe(false)
  })

  it('rejects invalid email', () => {
    expect(subcontractorSchema.safeParse({ name: 'Test', email: 'not-an-email' }).success).toBe(false)
  })

  it('accepts empty string for optional fields', () => {
    expect(subcontractorSchema.safeParse({ name: 'Test', email: '', phone: '', trade: '' }).success).toBe(true)
  })

  it('rejects quality_rating outside 1-5', () => {
    expect(subcontractorSchema.safeParse({ name: 'Test', quality_rating: 6 }).success).toBe(false)
    expect(subcontractorSchema.safeParse({ name: 'Test', quality_rating: 0 }).success).toBe(false)
  })

  it('accepts all valid ratings 1-5', () => {
    for (let r = 1; r <= 5; r++) {
      expect(subcontractorSchema.safeParse({
        name: 'Test',
        quality_rating: r,
        reliability_rating: r,
        price_rating: r,
      }).success).toBe(true)
    }
  })
})

describe('subAssignmentSchema', () => {
  it('accepts valid assignment', () => {
    expect(subAssignmentSchema.safeParse({
      subcontractor_id: '550e8400-e29b-41d4-a716-446655440000',
      order_id: '550e8400-e29b-41d4-a716-446655440001',
      description: 'Dacharbeiten Abschnitt 1',
      agreed_amount: 5000,
    }).success).toBe(true)
  })

  it('rejects missing subcontractor_id', () => {
    expect(subAssignmentSchema.safeParse({
      order_id: '550e8400-e29b-41d4-a716-446655440001',
      description: 'Test',
    }).success).toBe(false)
  })

  it('rejects empty description', () => {
    expect(subAssignmentSchema.safeParse({
      subcontractor_id: 'abc',
      order_id: 'def',
      description: '',
    }).success).toBe(false)
  })

  it('accepts assignment without amount', () => {
    expect(subAssignmentSchema.safeParse({
      subcontractor_id: 'abc',
      order_id: 'def',
      description: 'Elektroarbeiten',
    }).success).toBe(true)
  })
})
