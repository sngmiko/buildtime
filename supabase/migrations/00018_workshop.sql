-- Workshop system + availability status

CREATE TABLE workshop_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('vehicle', 'machine')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('repair', 'maintenance', 'tuev', 'inspection', 'accident')),
  description TEXT,
  workshop_name TEXT,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_completion TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in_repair', 'done', 'picked_up')),
  cost_parts DECIMAL(10,2) DEFAULT 0,
  cost_labor DECIMAL(10,2) DEFAULT 0,
  cost_external DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_workshop_company ON workshop_entries(company_id);
CREATE INDEX idx_workshop_entity ON workshop_entries(entity_type, entity_id);
CREATE INDEX idx_workshop_status ON workshop_entries(company_id, status);

CREATE TRIGGER workshop_updated_at BEFORE UPDATE ON workshop_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE workshop_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_company_workshop" ON workshop_entries FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_workshop" ON workshop_entries FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman', 'super_admin'));

-- Availability status on vehicles and equipment
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'in_use', 'workshop', 'reserved'));
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'in_use', 'workshop', 'reserved'));
