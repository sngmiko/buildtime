-- BuildTime Phase 2a: Zeiterfassung
-- Construction sites and time entries

CREATE TABLE construction_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  site_id UUID NOT NULL REFERENCES construction_sites(id),
  clock_in TIMESTAMPTZ NOT NULL DEFAULT now(),
  clock_out TIMESTAMPTZ,
  clock_in_lat DOUBLE PRECISION,
  clock_in_lng DOUBLE PRECISION,
  clock_out_lat DOUBLE PRECISION,
  clock_out_lng DOUBLE PRECISION,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sites_company ON construction_sites(company_id);
CREATE INDEX idx_sites_status ON construction_sites(company_id, status);
CREATE INDEX idx_time_entries_user ON time_entries(user_id);
CREATE INDEX idx_time_entries_site ON time_entries(site_id);
CREATE INDEX idx_time_entries_company_date ON time_entries(company_id, clock_in);
CREATE UNIQUE INDEX idx_one_open_entry_per_user ON time_entries(user_id) WHERE clock_out IS NULL;

CREATE TRIGGER sites_updated_at
  BEFORE UPDATE ON construction_sites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER time_entries_updated_at
  BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE construction_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_company_sites" ON construction_sites
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "manage_company_sites" ON construction_sites
  FOR ALL USING (
    company_id = auth.company_id()
    AND auth.user_role() IN ('owner', 'foreman')
  );

CREATE POLICY "select_company_entries" ON time_entries
  FOR SELECT USING (company_id = auth.company_id());

CREATE POLICY "worker_insert_own" ON time_entries
  FOR INSERT WITH CHECK (
    company_id = auth.company_id()
    AND user_id = auth.uid()
  );

CREATE POLICY "worker_update_own_open" ON time_entries
  FOR UPDATE USING (
    user_id = auth.uid()
    AND clock_out IS NULL
  ) WITH CHECK (
    user_id = auth.uid()
  );
