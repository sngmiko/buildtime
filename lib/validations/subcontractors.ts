import { z } from 'zod'

export const subcontractorSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  contact_person: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  trade: z.string().max(100).optional().or(z.literal('')),
  tax_exemption_valid_until: z.string().optional().or(z.literal('')),
  quality_rating: z.coerce.number().int().min(1).max(5).optional(),
  reliability_rating: z.coerce.number().int().min(1).max(5).optional(),
  price_rating: z.coerce.number().int().min(1).max(5).optional(),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export const subAssignmentSchema = z.object({
  subcontractor_id: z.string().min(1, 'Subunternehmer ist erforderlich'),
  order_id: z.string().min(1, 'Auftrag ist erforderlich'),
  description: z.string().min(1, 'Beschreibung ist erforderlich').max(500),
  agreed_amount: z.coerce.number().min(0).optional(),
})

export type SubcontractorInput = z.infer<typeof subcontractorSchema>
