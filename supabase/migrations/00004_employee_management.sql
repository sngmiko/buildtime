-- Module 1: Comprehensive Employee Management
-- Extends profiles with detailed personal data + related tables

-- =============================================================================
-- EXTEND PROFILES TABLE
-- =============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages TEXT[];
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contract_start DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contract_type TEXT CHECK (contract_type IN ('permanent', 'temporary', 'minijob', 'intern'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notice_period TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS probation_end DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS monthly_salary DECIMAL(10,2);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tax_class TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_security_number TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS health_insurance TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS annual_leave_days INTEGER DEFAULT 30;

-- =============================================================================
-- QUALIFICATIONS (Certificates with expiry)
-- =============================================================================
CREATE TABLE qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  issued_date DATE,
  expiry_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_qualifications_user ON qualifications(user_id);
CREATE INDEX idx_qualifications_expiry ON qualifications(company_id, expiry_date);

-- =============================================================================
-- SAFETY BRIEFINGS (Unterweisungen)
-- =============================================================================
CREATE TABLE safety_briefings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  briefing_date DATE NOT NULL,
  next_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_briefings_user ON safety_briefings(user_id);
CREATE INDEX idx_briefings_next ON safety_briefings(company_id, next_date);

-- =============================================================================
-- DOCUMENTS (File references)
-- =============================================================================
CREATE TABLE employee_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('contract', 'certificate', 'license', 'residence_permit', 'other')),
  file_path TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_documents_user ON employee_documents(user_id);

-- =============================================================================
-- LEAVE REQUESTS (Urlaubsanträge)
-- =============================================================================
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'vacation' CHECK (type IN ('vacation', 'sick', 'unpaid', 'special')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_by UUID REFERENCES profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_leave_user ON leave_requests(user_id);
CREATE INDEX idx_leave_status ON leave_requests(company_id, status);
CREATE INDEX idx_leave_dates ON leave_requests(user_id, start_date, end_date);

-- =============================================================================
-- SICK DAYS (Krankheitstage)
-- =============================================================================
CREATE TABLE sick_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days INTEGER NOT NULL,
  has_certificate BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_sick_user ON sick_days(user_id);

-- =============================================================================
-- TRIGGERS
-- =============================================================================
CREATE TRIGGER qualifications_updated_at
  BEFORE UPDATE ON qualifications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER briefings_updated_at
  BEFORE UPDATE ON safety_briefings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER leave_updated_at
  BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE safety_briefings ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sick_days ENABLE ROW LEVEL SECURITY;

-- All tables: company members can see, managers can manage
CREATE POLICY "select_company_qualifications" ON qualifications
  FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_qualifications" ON qualifications
  FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_briefings" ON safety_briefings
  FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_briefings" ON safety_briefings
  FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_documents" ON employee_documents
  FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_documents" ON employee_documents
  FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_leave" ON leave_requests
  FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "worker_create_leave" ON leave_requests
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id() AND user_id = auth.uid());
CREATE POLICY "manage_company_leave" ON leave_requests
  FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_sick" ON sick_days
  FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_sick" ON sick_days
  FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));
