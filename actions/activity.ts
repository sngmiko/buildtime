'use server'

import { createClient } from '@/lib/supabase/server'

export async function logActivity(
  action: string,
  entityType: string,
  entityId: string | null,
  title: string,
  details?: Record<string, unknown>
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile) return

  await supabase.from('activity_log').insert({
    company_id: profile.company_id,
    user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    title,
    details: details || null,
  })
}

export async function dismissTip(tipKey: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('dismissed_tips').upsert({
    user_id: user.id,
    tip_key: tipKey,
  }, { onConflict: 'user_id,tip_key' })
}

export async function getDismissedTips(): Promise<Set<string>> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Set()

  const { data } = await supabase
    .from('dismissed_tips')
    .select('tip_key')
    .eq('user_id', user.id)

  return new Set((data || []).map(d => d.tip_key))
}
