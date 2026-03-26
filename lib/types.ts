export type UserRole = 'owner' | 'foreman' | 'worker'

export type Profile = {
  id: string
  company_id: string
  role: UserRole
  first_name: string
  last_name: string
  phone: string | null
  invited_by: string | null
  created_at: string
  updated_at: string
}

export type Company = {
  id: string
  name: string
  address: string | null
  tax_id: string | null
  trade_license: string | null
  created_at: string
  updated_at: string
}

export type Invitation = {
  id: string
  company_id: string
  role: UserRole
  token: string
  email: string | null
  created_by: string
  expires_at: string
  accepted_at: string | null
  created_at: string
}
