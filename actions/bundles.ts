'use server'

import { createClient } from '@/lib/supabase/server'

export type BundleState = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
} | null

export async function createBundle(prevState: BundleState, formData: FormData): Promise<BundleState> {
  const name = formData.get('name') as string
  if (!name) return { message: 'Name ist erforderlich' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  const { data: bundle, error } = await supabase.from('material_bundles').insert({
    company_id: profile.company_id,
    name,
    description: formData.get('description') || null,
  }).select('id').single()

  if (error || !bundle) return { message: 'Bündel konnte nicht erstellt werden' }

  // Parse bundle items from form (dynamic fields)
  let i = 0
  while (formData.get(`item_material_${i}`)) {
    const materialId = formData.get(`item_material_${i}`) as string
    const quantity = parseFloat(formData.get(`item_quantity_${i}`) as string) || 1
    if (materialId) {
      await supabase.from('material_bundle_items').insert({
        bundle_id: bundle.id,
        material_id: materialId,
        quantity,
      })
    }
    i++
  }

  return { success: true, message: 'Bündel erstellt' }
}

export async function assignBundleToSite(bundleId: string, siteId: string, orderId?: string): Promise<BundleState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { message: 'Nicht angemeldet' }
  const { data: profile } = await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
  if (!profile || !['owner', 'foreman', 'super_admin'].includes(profile.role)) return { message: 'Keine Berechtigung' }

  // Get bundle items
  const { data: items } = await supabase.from('material_bundle_items').select('material_id, quantity').eq('bundle_id', bundleId)

  // Create stock movements for each item
  for (const item of items || []) {
    const { data: material } = await supabase.from('materials').select('current_stock, price_per_unit, name').eq('id', item.material_id).single()
    if (!material) continue

    await supabase.from('stock_movements').insert({
      company_id: profile.company_id,
      material_id: item.material_id,
      site_id: siteId,
      order_id: orderId || null,
      type: 'out',
      quantity: item.quantity,
      unit_price: material.price_per_unit || 0,
      notes: `Bündel-Zuweisung`,
      created_by: user.id,
    })

    // Update stock
    const newStock = Math.max(0, (material.current_stock || 0) - item.quantity)
    await supabase.from('materials').update({ current_stock: newStock }).eq('id', item.material_id)

    // Auto-create order cost if orderId
    if (orderId && material.price_per_unit) {
      await supabase.from('order_costs').insert({
        company_id: profile.company_id,
        order_id: orderId,
        category: 'material',
        description: `${material.name} (${item.quantity} Stk.)`,
        amount: item.quantity * (material.price_per_unit || 0),
        date: new Date().toISOString().split('T')[0],
      })
    }
  }

  return { success: true, message: 'Bündel der Baustelle zugewiesen — Lagerbestand aktualisiert' }
}
