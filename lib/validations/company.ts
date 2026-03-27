import { z } from 'zod'

export const companySchema = z.object({
  name: z.string().min(1, 'Firmenname ist erforderlich').max(200),
  address: z.string().max(500).optional().or(z.literal('')),
  tax_id: z.string().max(50).optional().or(z.literal('')),
  trade_license: z.string().max(50).optional().or(z.literal('')),
})

export const profileSchema = z.object({
  first_name: z.string().min(1, 'Vorname ist erforderlich').max(100),
  last_name: z.string().min(1, 'Nachname ist erforderlich').max(100),
  phone: z.string().max(30).optional().or(z.literal('')),
  language: z.enum(['de', 'pl', 'ro', 'tr', 'en']).optional(),
})

export type CompanyInput = z.infer<typeof companySchema>
export type ProfileInput = z.infer<typeof profileSchema>
