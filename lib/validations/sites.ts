import { z } from 'zod'

export const siteSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  address: z.string().max(500).optional().or(z.literal('')),
  status: z.enum(['active', 'completed', 'paused']).optional().default('active'),
})

export type SiteInput = z.infer<typeof siteSchema>
