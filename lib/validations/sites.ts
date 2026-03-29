import { z } from 'zod'

export const siteSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  address: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['active', 'completed', 'paused']).optional().default('active'),
  description: z.string().max(2000).optional().or(z.literal('')),
  client_name: z.string().max(200).optional().or(z.literal('')),
  client_phone: z.string().max(30).optional().or(z.literal('')),
  client_email: z.string().email().optional().or(z.literal('')),
  start_date: z.string().optional().or(z.literal('')),
  end_date: z.string().optional().or(z.literal('')),
  budget: z.coerce.number().min(0).optional().or(z.literal('')),
  site_manager: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  contact_name: z.string().max(200).optional().or(z.literal('')),
  contact_phone: z.string().max(30).optional().or(z.literal('')),
  contact_role: z.string().max(100).optional().or(z.literal('')),
})

export type SiteInput = z.infer<typeof siteSchema>
