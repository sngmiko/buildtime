'use client'

import { useActionState } from 'react'
import { updateCompany, type CompanyState } from '@/actions/company'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Company } from '@/lib/types'

export function CompanyForm({ company }: { company: Company }) {
  const [state, action, pending] = useActionState<CompanyState, FormData>(updateCompany, null)

  return (
    <form action={action} className="flex flex-col gap-4">
      <Input
        label="Firmenname"
        name="name"
        defaultValue={company.name}
        required
        error={state?.errors?.name?.[0]}
      />
      <Input
        label="Adresse"
        name="address"
        defaultValue={company.address || ''}
        error={state?.errors?.address?.[0]}
      />
      <Input
        label="Steuernummer"
        name="tax_id"
        defaultValue={company.tax_id || ''}
        error={state?.errors?.tax_id?.[0]}
      />
      <Input
        label="Handwerkskammer-Nr."
        name="trade_license"
        defaultValue={company.trade_license || ''}
        error={state?.errors?.trade_license?.[0]}
      />
      {state?.message && (
        <p className={`text-sm ${state.success ? 'text-green-600' : 'text-red-600'}`}>
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? 'Speichern...' : 'Firma speichern'}
      </Button>
    </form>
  )
}
