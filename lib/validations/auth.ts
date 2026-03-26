import { z } from 'zod'

export const registerSchema = z.object({
  company_name: z.string().min(1, 'Firmenname ist erforderlich').max(200),
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

export const loginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(1, 'Passwort ist erforderlich'),
})

export const acceptInviteSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
})

export const createInviteSchema = z.object({
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
  role: z.enum(['foreman', 'worker'], {
    errorMap: () => ({ message: 'Rolle muss Bauleiter oder Arbeiter sein' }),
  }),
  email: z.string().email('Ungültige E-Mail-Adresse').optional().or(z.literal('')),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>
export type CreateInviteInput = z.infer<typeof createInviteSchema>
