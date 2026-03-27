import { describe, it, expect } from 'vitest'
import { customerSchema, orderSchema, orderItemSchema, orderCostSchema } from '@/lib/validations/orders'

describe('customerSchema', () => {
  it('accepts valid customer with name only', () => {
    expect(customerSchema.safeParse({ name: 'Musterbau GmbH' }).success).toBe(true)
  })
  it('accepts customer with all fields', () => {
    expect(customerSchema.safeParse({
      name: 'Musterbau GmbH',
      contact_person: 'Max Mustermann',
      email: 'info@musterbau.de',
      phone: '030 123456',
      address: 'Musterstraße 1, 10115 Berlin',
      notes: 'Stammkunde',
    }).success).toBe(true)
  })
  it('rejects empty name', () => {
    expect(customerSchema.safeParse({ name: '' }).success).toBe(false)
  })
  it('rejects invalid email', () => {
    expect(customerSchema.safeParse({ name: 'Test', email: 'no-email' }).success).toBe(false)
  })
  it('accepts empty string for optional fields', () => {
    expect(customerSchema.safeParse({ name: 'Test', email: '', phone: '' }).success).toBe(true)
  })
  it('rejects name longer than 200 chars', () => {
    expect(customerSchema.safeParse({ name: 'x'.repeat(201) }).success).toBe(false)
  })
})

describe('orderSchema', () => {
  it('accepts valid order', () => {
    expect(orderSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Dachsanierung',
    }).success).toBe(true)
  })
  it('rejects missing customer_id', () => {
    expect(orderSchema.safeParse({ title: 'Dachsanierung' }).success).toBe(false)
  })
  it('rejects invalid customer_id (not UUID)', () => {
    expect(orderSchema.safeParse({ customer_id: 'not-a-uuid', title: 'Test' }).success).toBe(false)
  })
  it('rejects empty title', () => {
    expect(orderSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      title: '',
    }).success).toBe(false)
  })
  it('accepts all valid statuses', () => {
    for (const status of ['quote', 'commissioned', 'in_progress', 'acceptance', 'completed', 'complaint'] as const) {
      expect(orderSchema.safeParse({
        customer_id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Test',
        status,
      }).success).toBe(true)
    }
  })
  it('rejects invalid status', () => {
    expect(orderSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      status: 'invalid',
    }).success).toBe(false)
  })
  it('accepts budget as number', () => {
    expect(orderSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      budget: 5000,
    }).success).toBe(true)
  })
  it('accepts empty string for optional fields', () => {
    expect(orderSchema.safeParse({
      customer_id: '550e8400-e29b-41d4-a716-446655440000',
      title: 'Test',
      site_id: '',
      description: '',
    }).success).toBe(true)
  })
})

describe('orderItemSchema', () => {
  it('accepts valid order item', () => {
    expect(orderItemSchema.safeParse({
      position: 1,
      description: 'Dachziegel',
      quantity: 100,
      unit: 'Stk',
      unit_price: 2.50,
    }).success).toBe(true)
  })
  it('rejects empty description', () => {
    expect(orderItemSchema.safeParse({
      position: 1,
      description: '',
      quantity: 1,
      unit: 'Stk',
      unit_price: 10,
    }).success).toBe(false)
  })
  it('rejects quantity of 0', () => {
    expect(orderItemSchema.safeParse({
      position: 1,
      description: 'Test',
      quantity: 0,
      unit: 'Stk',
      unit_price: 10,
    }).success).toBe(false)
  })
  it('rejects negative unit_price', () => {
    expect(orderItemSchema.safeParse({
      position: 1,
      description: 'Test',
      quantity: 1,
      unit: 'Stk',
      unit_price: -1,
    }).success).toBe(false)
  })
  it('accepts unit_price of 0', () => {
    expect(orderItemSchema.safeParse({
      position: 1,
      description: 'Test',
      quantity: 1,
      unit: 'Stk',
      unit_price: 0,
    }).success).toBe(true)
  })
  it('coerces string numbers', () => {
    expect(orderItemSchema.safeParse({
      position: '2',
      description: 'Test',
      quantity: '5.5',
      unit: 'm²',
      unit_price: '12.99',
    }).success).toBe(true)
  })
})

describe('orderCostSchema', () => {
  it('accepts valid cost', () => {
    expect(orderCostSchema.safeParse({
      category: 'subcontractor',
      description: 'Dachdecker Müller',
      amount: 2500,
      date: '2026-03-26',
    }).success).toBe(true)
  })
  it('rejects missing date', () => {
    expect(orderCostSchema.safeParse({
      category: 'material',
      description: 'Schrauben',
      amount: 50,
      date: '',
    }).success).toBe(false)
  })
  it('rejects amount of 0', () => {
    expect(orderCostSchema.safeParse({
      category: 'other',
      description: 'Test',
      amount: 0,
      date: '2026-03-26',
    }).success).toBe(false)
  })
  it('rejects invalid category', () => {
    expect(orderCostSchema.safeParse({
      category: 'invalid',
      description: 'Test',
      amount: 100,
      date: '2026-03-26',
    }).success).toBe(false)
  })
  it('accepts all valid categories', () => {
    for (const category of ['subcontractor', 'material', 'equipment', 'vehicle', 'other'] as const) {
      expect(orderCostSchema.safeParse({
        category,
        description: 'Test',
        amount: 100,
        date: '2026-03-26',
      }).success).toBe(true)
    }
  })
  it('rejects empty description', () => {
    expect(orderCostSchema.safeParse({
      category: 'other',
      description: '',
      amount: 100,
      date: '2026-03-26',
    }).success).toBe(false)
  })
})
