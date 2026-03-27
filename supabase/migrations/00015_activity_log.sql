-- Activity Log for real-time feed
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'clock_in', 'clock_out', 'status_change', 'login')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  title TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_company ON activity_log(company_id, created_at DESC);
CREATE INDEX idx_activity_user ON activity_log(user_id, created_at DESC);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_company_activity" ON activity_log FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "insert_company_activity" ON activity_log FOR INSERT WITH CHECK (company_id = public.get_my_company_id());
CREATE POLICY "superadmin_activity" ON activity_log FOR ALL USING (public.get_my_role() = 'super_admin');

-- Dismissed tips per user
CREATE TABLE dismissed_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  tip_key TEXT NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tip_key)
);

ALTER TABLE dismissed_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tips" ON dismissed_tips FOR ALL USING (user_id = auth.uid());
