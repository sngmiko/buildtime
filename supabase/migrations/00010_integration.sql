-- Integration Layer: Notifications + Cross-module links

-- Notifications system
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN (
    'qualification_expiring', 'inspection_due', 'budget_warning',
    'low_stock', 'tax_exemption_expiring', 'leave_pending',
    'order_status', 'general'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, read_at);
CREATE INDEX idx_notifications_company ON notifications(company_id, created_at);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_own_notifications" ON notifications
  FOR SELECT USING (
    company_id = public.get_my_company_id()
    AND (user_id = auth.uid() OR user_id IS NULL OR public.get_my_role() IN ('owner', 'foreman'))
  );
CREATE POLICY "manage_own_notifications" ON notifications
  FOR UPDATE USING (
    company_id = public.get_my_company_id()
    AND (user_id = auth.uid() OR public.get_my_role() IN ('owner', 'foreman'))
  );
CREATE POLICY "insert_company_notifications" ON notifications
  FOR INSERT WITH CHECK (company_id = public.get_my_company_id());

-- Add soft-delete to key tables
ALTER TABLE orders ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE materials ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE subcontractors ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Link construction_sites to orders (if not already linked)
-- orders.site_id already exists from 00007
