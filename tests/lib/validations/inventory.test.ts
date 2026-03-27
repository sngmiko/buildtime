import { describe, it, expect } from 'vitest'
import { supplierSchema, materialSchema, orderSchema, stockMovementSchema } from '@/lib/validations/inventory'

describe('supplierSchema', () => {
  it('accepts valid supplier', () => {
    expect(supplierSchema.safeParse({ name: 'Bauhaus GmbH' }).success).toBe(true)
  })
  it('accepts supplier with all fields', () => {
    expect(supplierSchema.safeParse({
      name: 'Bauhaus GmbH',
      contact_person: 'Max Mustermann',
      email: 'info@bauhaus.de',
      phone: '0800 123456',
      address: 'Musterstraße 1, 10115 Berlin',
      rating: 4,
      notes: 'Guter Lieferant',
    }).success).toBe(true)
  })
  it('rejects empty name', () => {
    expect(supplierSchema.safeParse({ name: '' }).success).toBe(false)
  })
  it('rejects invalid email', () => {
    expect(supplierSchema.safeParse({ name: 'Test', email: 'not-an-email' }).success).toBe(false)
  })
  it('rejects rating out of range', () => {
    expect(supplierSchema.safeParse({ name: 'Test', rating: 6 }).success).toBe(false)
  })
  it('accepts empty string for optional fields', () => {
    expect(supplierSchema.safeParse({ name: 'Test', email: '', phone: '' }).success).toBe(true)
  })
})

describe('materialSchema', () => {
  it('accepts valid material', () => {
    expect(materialSchema.safeParse({
      name: 'Zement CEM I',
      unit: 'kg',
      category: 'building_material',
    }).success).toBe(true)
  })
  it('rejects empty name', () => {
    expect(materialSchema.safeParse({ name: '', unit: 'piece', category: 'other' }).success).toBe(false)
  })
  it('rejects invalid unit', () => {
    expect(materialSchema.safeParse({ name: 'Test', unit: 'gallon', category: 'other' }).success).toBe(false)
  })
  it('rejects invalid category', () => {
    expect(materialSchema.safeParse({ name: 'Test', unit: 'piece', category: 'invalid' }).success).toBe(false)
  })
  it('accepts all valid units', () => {
    for (const unit of ['piece', 'm', 'm2', 'm3', 'kg', 'l', 'pack'] as const) {
      expect(materialSchema.safeParse({ name: 'Test', unit, category: 'other' }).success).toBe(true)
    }
  })
})

describe('orderSchema', () => {
  it('accepts valid order', () => {
    expect(orderSchema.safeParse({ order_date: '2026-03-26' }).success).toBe(true)
  })
  it('rejects missing order_date', () => {
    expect(orderSchema.safeParse({ order_date: '' }).success).toBe(false)
  })
  it('rejects invalid status', () => {
    expect(orderSchema.safeParse({ order_date: '2026-03-26', status: 'pending' }).success).toBe(false)
  })
  it('accepts valid status values', () => {
    for (const status of ['draft', 'ordered', 'partially_delivered', 'delivered', 'cancelled'] as const) {
      expect(orderSchema.safeParse({ order_date: '2026-03-26', status }).success).toBe(true)
    }
  })
})

describe('stockMovementSchema', () => {
  const validUuid = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'

  it('accepts valid stock movement', () => {
    expect(stockMovementSchema.safeParse({
      material_id: validUuid,
      type: 'in',
      quantity: 50,
    }).success).toBe(true)
  })
  it('rejects quantity of 0', () => {
    expect(stockMovementSchema.safeParse({
      material_id: validUuid,
      type: 'in',
      quantity: 0,
    }).success).toBe(false)
  })
  it('rejects invalid type', () => {
    expect(stockMovementSchema.safeParse({
      material_id: validUuid,
      type: 'transfer',
      quantity: 10,
    }).success).toBe(false)
  })
  it('rejects missing material_id', () => {
    expect(stockMovementSchema.safeParse({
      material_id: 'not-a-uuid',
      type: 'out',
      quantity: 5,
    }).success).toBe(false)
  })
})
