-- Module 2: Fleet & Equipment Management

-- Vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  license_plate TEXT NOT NULL,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  type TEXT NOT NULL DEFAULT 'car' CHECK (type IN ('car', 'van', 'truck')),
  mileage INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'decommissioned')),
  assigned_to UUID REFERENCES profiles(id),
  leasing_cost DECIMAL(10,2),
  insurance_cost DECIMAL(10,2),
  tax_cost DECIMAL(10,2),
  next_inspection DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Equipment
CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'tool' CHECK (category IN ('heavy', 'power_tool', 'tool', 'safety', 'other')),
  serial_number TEXT,
  purchase_date DATE,
  purchase_price DECIMAL(10,2),
  daily_rate DECIMAL(10,2),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'in_use', 'maintenance', 'defect', 'disposed')),
  assigned_site UUID REFERENCES construction_sites(id),
  next_maintenance DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fuel logs
CREATE TABLE fuel_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  liters DECIMAL(8,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  mileage INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Trip logs (Fahrtenbuch)
CREATE TABLE trip_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES profiles(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_location TEXT NOT NULL,
  end_location TEXT NOT NULL,
  km DECIMAL(8,1) NOT NULL,
  purpose TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Equipment costs
CREATE TABLE equipment_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('maintenance', 'repair', 'fuel', 'other')),
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_vehicles_company ON vehicles(company_id);
CREATE INDEX idx_equipment_company ON equipment(company_id);
CREATE INDEX idx_equipment_site ON equipment(assigned_site);
CREATE INDEX idx_fuel_vehicle ON fuel_logs(vehicle_id);
CREATE INDEX idx_trips_vehicle ON trip_logs(vehicle_id);
CREATE INDEX idx_eq_costs ON equipment_costs(equipment_id);

-- Triggers
CREATE TRIGGER vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER equipment_updated_at BEFORE UPDATE ON equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_company_vehicles" ON vehicles FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_vehicles" ON vehicles FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_equipment" ON equipment FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_equipment" ON equipment FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_fuel" ON fuel_logs FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_fuel" ON fuel_logs FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_trips" ON trip_logs FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_trips" ON trip_logs FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_eq_costs" ON equipment_costs FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_eq_costs" ON equipment_costs FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));
