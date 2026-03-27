import { describe, it, expect } from 'vitest'
import { vehicleSchema, equipmentSchema, fuelLogSchema } from '@/lib/validations/fleet'

describe('vehicleSchema', () => {
  it('accepts valid vehicle', () => {
    expect(vehicleSchema.safeParse({ license_plate: 'B-AB 1234', make: 'VW', model: 'Crafter', type: 'van' }).success).toBe(true)
  })
  it('rejects empty plate', () => {
    expect(vehicleSchema.safeParse({ license_plate: '', make: 'VW', model: 'Crafter', type: 'van' }).success).toBe(false)
  })
})

describe('equipmentSchema', () => {
  it('accepts valid equipment', () => {
    expect(equipmentSchema.safeParse({ name: 'Bagger CAT 320', category: 'heavy' }).success).toBe(true)
  })
  it('rejects empty name', () => {
    expect(equipmentSchema.safeParse({ name: '', category: 'tool' }).success).toBe(false)
  })
})

describe('fuelLogSchema', () => {
  it('accepts valid fuel log', () => {
    expect(fuelLogSchema.safeParse({ date: '2026-03-26', liters: 45.5, cost: 82.30 }).success).toBe(true)
  })
})
