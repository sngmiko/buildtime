import { z } from 'zod'

export const diaryEntrySchema = z.object({
  site_id: z.string().min(1, 'Baustelle ist erforderlich'),
  entry_date: z.string().min(1, 'Datum ist erforderlich'),
  weather: z.string().max(100).optional().or(z.literal('')),
  temperature: z.coerce.number().int().min(-50).max(60).optional(),
  wind: z.string().max(100).optional().or(z.literal('')),
  work_description: z.string().min(1, 'Arbeitsbeschreibung ist erforderlich').max(5000),
  incidents: z.string().max(2000).optional().or(z.literal('')),
  defects: z.string().max(2000).optional().or(z.literal('')),
  hindrances: z.string().max(2000).optional().or(z.literal('')),
})

export type DiaryEntryInput = z.infer<typeof diaryEntrySchema>
