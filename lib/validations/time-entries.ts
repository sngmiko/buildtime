import { z } from 'zod'

export const clockInSchema = z.object({
  site_id: z.string().min(1, 'Baustelle ist erforderlich'),
})

export const clockOutSchema = z.object({
  entry_id: z.string().min(1, 'Eintrag-ID ist erforderlich'),
  break_minutes: z.coerce
    .number()
    .int()
    .min(0, 'Pause kann nicht negativ sein')
    .max(480, 'Pause kann nicht mehr als 8 Stunden sein'),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export type ClockInInput = z.infer<typeof clockInSchema>
export type ClockOutInput = z.infer<typeof clockOutSchema>

export const editEntrySchema = z.object({
  clock_in: z.string().min(1, 'Startzeit ist erforderlich'),
  clock_out: z.string().min(1, 'Endzeit ist erforderlich'),
  break_minutes: z.coerce.number().int().min(0, 'Pause kann nicht negativ sein').max(480, 'Pause kann nicht mehr als 8 Stunden sein'),
  site_id: z.string().min(1, 'Baustelle ist erforderlich'),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export type EditEntryInput = z.infer<typeof editEntrySchema>
