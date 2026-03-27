'use client'

import { useActionState } from 'react'
import { adminUpdateCompany, adminExtendTrial, adminToggleCompany, type AdminState } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { CompanyExtended } from '@/lib/types'

export function AdminEditForm({ company }: { company: CompanyExtended }) {
  const boundUpdate = adminUpdateCompany.bind(null, company.id)
  const [state, action, pending] = useActionState<AdminState, FormData>(boundUpdate, null)

  async function handleExtendTrial() { await adminExtendTrial(company.id, 7) }
  async function handleToggle() { await adminToggleCompany(company.id, !company.is_active) }

  return (
    <div className="flex flex-col gap-4">
      <form action={action} className="flex flex-col gap-4">
        <Input label="Firmenname" name="name" defaultValue={company.name} required />
        <Select label="Plan" name="plan" defaultValue={company.plan} options={[
          { value: 'trial', label: 'Trial' },
          { value: 'starter', label: 'Starter (49€)' },
          { value: 'business', label: 'Business (99€)' },
          { value: 'enterprise', label: 'Enterprise (199€)' },
        ]} />
        <input type="hidden" name="is_active" value={company.is_active ? 'true' : 'false'} />
        {state?.message && <p className={`text-sm ${state.success ? 'text-emerald-600' : 'text-red-600'}`}>{state.message}</p>}
        <Button type="submit" disabled={pending}>{pending ? 'Speichern...' : 'Speichern'}</Button>
      </form>
      <div className="flex gap-2 border-t border-slate-200 pt-4">
        {company.plan === 'trial' && (
          <Button variant="outline" size="sm" onClick={handleExtendTrial}>Trial +7 Tage</Button>
        )}
        <Button variant={company.is_active ? 'destructive' : 'primary'} size="sm" onClick={handleToggle}>
          {company.is_active ? 'Deaktivieren' : 'Aktivieren'}
        </Button>
      </div>
    </div>
  )
}
