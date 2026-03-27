import { z } from 'zod'

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  contact_person: z.string().max(200).optional().or(z.literal('')),
  email: z.string().email('Ungültige E-Mail').optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  rating: z.coerce.number().int().min(1).max(5).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
})

export const materialSchema = z.object({
  name: z.string().min(1, 'Name ist erforderlich').max(200),
  article_number: z.string().max(100).optional().or(z.literal('')),
  unit: z.enum(['piece', 'm', 'm2', 'm3', 'kg', 'l', 'pack']),
  price_per_unit: z.coerce.number().min(0).optional().or(z.literal('')),
  supplier_id: z.string().uuid().optional().or(z.literal('')),
  min_stock: z.coerce.number().min(0).optional(),
  current_stock: z.coerce.number().min(0).optional(),
  category: z.enum(['building_material', 'consumable', 'tool', 'small_parts', 'other']),
})

export const orderSchema = z.object({
  supplier_id: z.string().uuid('Lieferant ist erforderlich').optional().or(z.literal('')),
  order_date: z.string().min(1, 'Datum ist erforderlich'),
  status: z.enum(['draft', 'ordered', 'partially_delivered', 'delivered', 'cancelled']).optional(),
  total_amount: z.coerce.number().min(0).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  order_id: z.string().optional().or(z.literal('')),
})

export const stockMovementSchema = z.object({
  material_id: z.string().uuid('Material ist erforderlich'),
  site_id: z.string().uuid().optional().or(z.literal('')),
  type: z.enum(['in', 'out', 'return']),
  quantity: z.coerce.number().min(0.01, 'Menge muss größer als 0 sein'),
  notes: z.string().max(500).optional().or(z.literal('')),
  order_id: z.string().optional().or(z.literal('')),
  unit_price: z.coerce.number().min(0).optional().or(z.literal('')),
})
