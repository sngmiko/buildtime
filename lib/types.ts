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

export type ContractType = 'permanent' | 'temporary' | 'minijob' | 'intern'

export type ProfileExtended = Profile & {
  address: string | null
  birth_date: string | null
  nationality: string | null
  languages: string[] | null
  contract_start: string | null
  contract_type: ContractType | null
  notice_period: string | null
  probation_end: string | null
  hourly_rate: number | null
  monthly_salary: number | null
  tax_class: string | null
  social_security_number: string | null
  health_insurance: string | null
  iban: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relation: string | null
  annual_leave_days: number
}

export type Qualification = {
  id: string
  company_id: string
  user_id: string
  name: string
  issued_date: string | null
  expiry_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type SafetyBriefing = {
  id: string
  company_id: string
  user_id: string
  topic: string
  briefing_date: string
  next_date: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type DocCategory = 'contract' | 'certificate' | 'license' | 'residence_permit' | 'other'

export type EmployeeDocument = {
  id: string
  company_id: string
  user_id: string
  name: string
  category: DocCategory
  file_path: string
  file_size: number | null
  uploaded_at: string
}

export type LeaveType = 'vacation' | 'sick' | 'unpaid' | 'special'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export type LeaveRequest = {
  id: string
  company_id: string
  user_id: string
  start_date: string
  end_date: string
  days: number
  type: LeaveType
  status: LeaveStatus
  approved_by: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type SickDay = {
  id: string
  company_id: string
  user_id: string
  start_date: string
  end_date: string
  days: number
  has_certificate: boolean
  notes: string | null
  created_at: string
}
