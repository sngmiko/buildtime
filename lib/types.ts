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

export type VehicleType = 'car' | 'van' | 'truck'
export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'decommissioned'

export type Vehicle = {
  id: string
  company_id: string
  license_plate: string
  make: string
  model: string
  year: number | null
  type: VehicleType
  mileage: number
  status: VehicleStatus
  assigned_to: string | null
  leasing_cost: number | null
  insurance_cost: number | null
  tax_cost: number | null
  next_inspection: string | null
  created_at: string
  updated_at: string
}

export type EquipmentCategory = 'heavy' | 'power_tool' | 'tool' | 'safety' | 'other'
export type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'defect' | 'disposed'

export type Equipment = {
  id: string
  company_id: string
  name: string
  category: EquipmentCategory
  serial_number: string | null
  purchase_date: string | null
  purchase_price: number | null
  daily_rate: number | null
  status: EquipmentStatus
  assigned_site: string | null
  next_maintenance: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type FuelLog = {
  id: string
  company_id: string
  vehicle_id: string
  date: string
  liters: number
  cost: number
  mileage: number | null
  created_at: string
}

export type TripLog = {
  id: string
  company_id: string
  vehicle_id: string
  driver_id: string
  date: string
  start_location: string
  end_location: string
  km: number
  purpose: string
  created_at: string
}

export type EquipmentCost = {
  id: string
  company_id: string
  equipment_id: string
  type: 'maintenance' | 'repair' | 'fuel' | 'other'
  amount: number
  date: string
  description: string | null
  created_at: string
}

export type Supplier = {
  id: string
  company_id: string
  name: string
  contact_person: string | null
  email: string | null
  phone: string | null
  address: string | null
  rating: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type MaterialUnit = 'piece' | 'm' | 'm2' | 'm3' | 'kg' | 'l' | 'pack'
export type MaterialCategory = 'building_material' | 'consumable' | 'tool' | 'small_parts' | 'other'

export type Material = {
  id: string
  company_id: string
  name: string
  article_number: string | null
  unit: MaterialUnit
  price_per_unit: number | null
  supplier_id: string | null
  min_stock: number
  current_stock: number
  category: MaterialCategory
  created_at: string
  updated_at: string
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'partially_delivered' | 'delivered' | 'cancelled'

export type PurchaseOrder = {
  id: string
  company_id: string
  supplier_id: string | null
  order_date: string
  status: PurchaseOrderStatus
  total_amount: number | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type PurchaseOrderItem = {
  id: string
  order_id: string
  material_id: string | null
  quantity: number
  unit_price: number
  delivered_quantity: number
  created_at: string
}

export type StockMovementType = 'in' | 'out' | 'return'

export type StockMovement = {
  id: string
  company_id: string
  material_id: string
  site_id: string | null
  type: StockMovementType
  quantity: number
  notes: string | null
  created_by: string
  created_at: string
}

export type OrderStatus = 'quote' | 'commissioned' | 'in_progress' | 'acceptance' | 'completed' | 'complaint'

export type Customer = {
  id: string; company_id: string; name: string; contact_person: string | null
  email: string | null; phone: string | null; address: string | null; notes: string | null
  created_at: string; updated_at: string
}

export type Order = {
  id: string; company_id: string; customer_id: string; site_id: string | null
  title: string; description: string | null; status: OrderStatus
  start_date: string | null; end_date: string | null; budget: number | null
  created_at: string; updated_at: string
}

export type OrderItem = {
  id: string; order_id: string; position: number; description: string
  quantity: number; unit: string; unit_price: number; created_at: string
}

export type OrderAssignment = {
  id: string; order_id: string; resource_type: 'employee' | 'vehicle' | 'equipment'
  resource_id: string; start_date: string | null; end_date: string | null
  notes: string | null; created_at: string
}

export type OrderCost = {
  id: string; company_id: string; order_id: string
  category: 'subcontractor' | 'material' | 'equipment' | 'vehicle' | 'other'
  description: string; amount: number; date: string; created_at: string
}
