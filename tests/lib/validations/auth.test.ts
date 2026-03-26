import { describe, it, expect } from 'vitest'
import { registerSchema, loginSchema, acceptInviteSchema, createInviteSchema } from '@/lib/validations/auth'

describe('registerSchema', () => {
  it('accepts valid registration data', () => {
    const result = registerSchema.safeParse({
      company_name: 'Bau GmbH',
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'max@bau-gmbh.de',
      password: 'sicheres-passwort-123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty company name', () => {
    const result = registerSchema.safeParse({
      company_name: '',
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'max@bau-gmbh.de',
      password: 'sicheres-passwort-123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short password', () => {
    const result = registerSchema.safeParse({
      company_name: 'Bau GmbH',
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'max@bau-gmbh.de',
      password: '12345',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = registerSchema.safeParse({
      company_name: 'Bau GmbH',
      first_name: 'Max',
      last_name: 'Mustermann',
      email: 'not-an-email',
      password: 'sicheres-passwort-123',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid login data', () => {
    const result = loginSchema.safeParse({
      email: 'max@bau-gmbh.de',
      password: 'sicheres-passwort-123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'max@bau-gmbh.de',
      password: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('acceptInviteSchema', () => {
  it('accepts valid invite acceptance', () => {
    const result = acceptInviteSchema.safeParse({
      first_name: 'Hans',
      last_name: 'Arbeiter',
      email: 'arbeiter@email.de',
      password: 'mein-passwort-123',
    })
    expect(result.success).toBe(true)
  })
})

describe('createInviteSchema', () => {
  it('accepts valid invite with email', () => {
    const result = createInviteSchema.safeParse({
      first_name: 'Hans',
      last_name: 'Arbeiter',
      role: 'worker',
      email: 'hans@email.de',
    })
    expect(result.success).toBe(true)
  })

  it('accepts valid invite without email', () => {
    const result = createInviteSchema.safeParse({
      first_name: 'Hans',
      last_name: 'Arbeiter',
      role: 'worker',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid role', () => {
    const result = createInviteSchema.safeParse({
      first_name: 'Hans',
      last_name: 'Arbeiter',
      role: 'admin',
    })
    expect(result.success).toBe(false)
  })

  it('rejects owner role in invitations', () => {
    const result = createInviteSchema.safeParse({
      first_name: 'Hans',
      last_name: 'Arbeiter',
      role: 'owner',
    })
    expect(result.success).toBe(false)
  })
})
