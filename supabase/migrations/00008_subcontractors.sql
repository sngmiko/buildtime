-- Module 5: Subcontractor Management

CREATE TABLE subcontractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  trade TEXT,
  tax_exemption_valid_until DATE,
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  reliability_rating INTEGER CHECK (reliability_rating BETWEEN 1 AND 5),
  price_rating INTEGER CHECK (price_rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE subcontractor_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  subcontractor_id UUID NOT NULL REFERENCES subcontractors(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id),
  description TEXT NOT NULL,
  agreed_amount DECIMAL(12,2),
  invoiced_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subcontractors_company ON subcontractors(company_id);
CREATE INDEX idx_sub_assignments ON subcontractor_assignments(subcontractor_id);
CREATE TRIGGER subcontractors_updated_at BEFORE UPDATE ON subcontractors FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER sub_assignments_updated_at BEFORE UPDATE ON subcontractor_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE subcontractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcontractor_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_company_subs" ON subcontractors FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_subs" ON subcontractors FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));
CREATE POLICY "select_company_sub_assign" ON subcontractor_assignments FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_sub_assign" ON subcontractor_assignments FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));
