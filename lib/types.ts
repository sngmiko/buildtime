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

export type SiteStatus = 'active' | 'completed' | 'paused'

export type ConstructionSite = {
  id: string
  company_id: string
  name: string
  address: string | null
  status: SiteStatus
  created_by: string
  created_at: string
  updated_at: string
}

export type TimeEntry = {
  id: string
  company_id: string
  user_id: string
  site_id: string
  clock_in: string
  clock_out: string | null
  clock_in_lat: number | null
  clock_in_lng: number | null
  clock_out_lat: number | null
  clock_out_lng: number | null
  break_minutes: number
  notes: string | null
  created_at: string
  updated_at: string
  edited_by: string | null
  edited_at: string | null
}
