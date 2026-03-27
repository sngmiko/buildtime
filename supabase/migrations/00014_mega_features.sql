-- Mega Features Migration: Invoicing, Planning, Documents, Weather, QR, i18n, etc.

-- =============================================================================
-- 1. INVOICING (Rechnungen)
-- =============================================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  order_id UUID REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 19,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) DEFAULT 0,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Stk',
  unit_price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoices_company ON invoices(company_id);
CREATE INDEX idx_invoices_status ON invoices(company_id, status);
CREATE INDEX idx_invoices_order ON invoices(order_id);
CREATE INDEX idx_invoice_items ON invoice_items(invoice_id);

CREATE TRIGGER invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_company_invoices" ON invoices FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_invoices" ON invoices FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));
CREATE POLICY "select_invoice_items" ON invoice_items FOR SELECT USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.company_id = public.get_my_company_id()));
CREATE POLICY "manage_invoice_items" ON invoice_items FOR ALL USING (EXISTS (SELECT 1 FROM invoices WHERE invoices.id = invoice_items.invoice_id AND invoices.company_id = public.get_my_company_id()) AND public.get_my_role() IN ('owner', 'foreman'));

-- =============================================================================
-- 2. WEEKLY PLANNING (Disposition)
-- =============================================================================
CREATE TABLE schedule_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  site_id UUID NOT NULL REFERENCES construction_sites(id),
  date DATE NOT NULL,
  shift TEXT DEFAULT 'full' CHECK (shift IN ('full', 'morning', 'afternoon')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

CREATE INDEX idx_schedule_company ON schedule_entries(company_id, date);
CREATE INDEX idx_schedule_user ON schedule_entries(user_id, date);

ALTER TABLE schedule_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_company_schedule" ON schedule_entries FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_schedule" ON schedule_entries FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

-- =============================================================================
-- 3. DOCUMENT UPLOADS
-- =============================================================================
-- employee_documents table already exists, extend it
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS entity_type TEXT DEFAULT 'employee' CHECK (entity_type IN ('employee', 'vehicle', 'equipment', 'site', 'company'));
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE employee_documents ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- =============================================================================
-- 5. NACHKALKULATION (post-calculation)
-- Already handled through existing order_costs + time_entries queries, no new tables needed
-- =============================================================================

-- =============================================================================
-- 8. SICK REPORTING
-- =============================================================================
ALTER TABLE sick_days ADD COLUMN IF NOT EXISTS reported_by UUID REFERENCES profiles(id);
ALTER TABLE sick_days ADD COLUMN IF NOT EXISTS certificate_file TEXT;
ALTER TABLE sick_days ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'reported' CHECK (status IN ('reported', 'confirmed', 'rejected'));

-- Allow workers to create their own sick reports
CREATE POLICY "worker_report_sick" ON sick_days
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id() AND user_id = auth.uid());

-- =============================================================================
-- 9. AUFMASS (measurements)
-- =============================================================================
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  order_id UUID REFERENCES orders(id),
  site_id UUID REFERENCES construction_sites(id),
  description TEXT NOT NULL,
  length DECIMAL(10,3),
  width DECIMAL(10,3),
  height DECIMAL(10,3),
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'm2',
  calculated_value DECIMAL(12,3),
  notes TEXT,
  measured_by UUID NOT NULL REFERENCES profiles(id),
  measured_at DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_measurements_order ON measurements(order_id);
CREATE INDEX idx_measurements_site ON measurements(site_id);

ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_company_measurements" ON measurements FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_measurements" ON measurements FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

-- =============================================================================
-- 10. QR CODE SITES
-- =============================================================================
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS qr_code TEXT;

-- =============================================================================
-- 12. I18N (worker language preference)
-- =============================================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'de' CHECK (language IN ('de', 'pl', 'ro', 'tr', 'en'));

-- =============================================================================
-- 13. PHOTOS ON TIME ENTRIES
-- =============================================================================
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- =============================================================================
-- 14. PAYMENT REMINDERS (Mahnwesen)
-- =============================================================================
CREATE TABLE payment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  invoice_id UUID NOT NULL REFERENCES invoices(id),
  reminder_level INTEGER NOT NULL DEFAULT 1,
  sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_amount DECIMAL(12,2) NOT NULL,
  fee DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_invoice ON payment_reminders(invoice_id);

ALTER TABLE payment_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_company_reminders" ON payment_reminders FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_reminders" ON payment_reminders FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

-- =============================================================================
-- 15. COMPANY SETTINGS for invoicing
-- =============================================================================
ALTER TABLE companies ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'RE';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS next_invoice_number INTEGER DEFAULT 1;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_tax_rate DECIMAL(5,2) DEFAULT 19;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS payment_terms_days INTEGER DEFAULT 14;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_iban TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS bank_bic TEXT;
