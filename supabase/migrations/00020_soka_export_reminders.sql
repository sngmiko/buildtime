-- Phase 11: SOKA-Bau, Steuerberater-Export, Erinnerungen

-- SOKA-Bau Firmendaten
ALTER TABLE companies ADD COLUMN IF NOT EXISTS soka_betriebskonto_nr TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS soka_branchenkennziffer TEXT DEFAULT '1';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS soka_umlagesatz_urlaub DECIMAL(5,2) DEFAULT 14.3;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS soka_umlagesatz_berufsbildung DECIMAL(5,2) DEFAULT 2.6;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS soka_umlagesatz_rente DECIMAL(5,2) DEFAULT 3.2;

-- SOKA-Bau Mitarbeiterdaten
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS soka_arbeitnehmer_nr TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS soka_urlaubsanspruch_tage INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS soka_urlaubsguthaben DECIMAL(10,2);

-- Steuerberater
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_advisor_name TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_advisor_email TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_advisor_phone TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS tax_advisor_firm TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS auto_export_day INTEGER DEFAULT 5;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS auto_export_enabled BOOLEAN DEFAULT false;

-- Erinnerungen
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('clock_in', 'document_expiry', 'custom')),
  message TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  channel TEXT NOT NULL DEFAULT 'in_app' CHECK (channel IN ('in_app', 'whatsapp', 'email')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_reminders_company ON reminders(company_id, scheduled_for);
CREATE INDEX idx_reminders_user ON reminders(user_id, status);

ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_company_reminders_r" ON reminders FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_reminders_r" ON reminders FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman', 'super_admin'));

-- Erinnerungs-Einstellungen
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reminder_clock_in_enabled BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS reminder_minutes_before INTEGER DEFAULT 30;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS default_work_start_time TEXT DEFAULT '07:00';
