-- Super-Admin + Trial/Pricing System

-- Add super_admin to user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'super_admin';

-- Extend companies with plan/trial
ALTER TABLE companies ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial', 'starter', 'business', 'enterprise'));
ALTER TABLE companies ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS max_employees INTEGER DEFAULT 5;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2) DEFAULT 0;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Set trial defaults
UPDATE companies SET trial_ends_at = created_at + INTERVAL '7 days' WHERE trial_ends_at IS NULL;

-- Super-admin can see everything (bypass company isolation)
CREATE POLICY "superadmin_select_all_companies" ON companies
  FOR SELECT USING (public.get_my_role() = 'super_admin');
CREATE POLICY "superadmin_manage_all_companies" ON companies
  FOR ALL USING (public.get_my_role() = 'super_admin');

CREATE POLICY "superadmin_select_all_profiles" ON profiles
  FOR SELECT USING (public.get_my_role() = 'super_admin');
CREATE POLICY "superadmin_manage_all_profiles" ON profiles
  FOR ALL USING (public.get_my_role() = 'super_admin');

-- Onboarding checklist
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) UNIQUE,
  profile_completed BOOLEAN DEFAULT false,
  first_site_created BOOLEAN DEFAULT false,
  first_employee_invited BOOLEAN DEFAULT false,
  first_time_entry BOOLEAN DEFAULT false,
  first_order_created BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER onboarding_updated_at BEFORE UPDATE ON onboarding_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();
ALTER TABLE onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_own_onboarding" ON onboarding_progress FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_own_onboarding" ON onboarding_progress FOR ALL USING (company_id = public.get_my_company_id());
CREATE POLICY "superadmin_onboarding" ON onboarding_progress FOR ALL USING (public.get_my_role() = 'super_admin');
