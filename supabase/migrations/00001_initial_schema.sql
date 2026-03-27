-- BuildTime Phase 1: Auth, Firmenverwaltung & Basis-UI
-- Tables, RLS policies, helper functions, and triggers

-- =============================================================================
-- ENUMS
-- =============================================================================
CREATE TYPE user_role AS ENUM ('owner', 'foreman', 'worker');

-- =============================================================================
-- TABLES
-- =============================================================================
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT,
  tax_id TEXT,
  trade_license TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id),
  role user_role NOT NULL DEFAULT 'worker',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  invited_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  role user_role NOT NULL DEFAULT 'worker',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  email TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '7 days',
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX idx_profiles_company ON profiles(company_id);
CREATE INDEX idx_invitations_token ON invitations(token);
CREATE INDEX idx_invitations_company ON invitations(company_id);

-- =============================================================================
-- UPDATED_AT TRIGGER
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- RLS HELPER FUNCTIONS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.get_my_company_id() RETURNS UUID AS $$
  SELECT company_id FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_role() RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- COMPANIES
CREATE POLICY "select_own_company" ON companies
  FOR SELECT USING (id = public.get_my_company_id());

CREATE POLICY "owner_update_company" ON companies
  FOR UPDATE USING (id = public.get_my_company_id() AND public.get_my_role() = 'owner');

-- PROFILES
CREATE POLICY "select_company_profiles" ON profiles
  FOR SELECT USING (company_id = public.get_my_company_id());

CREATE POLICY "manage_company_profiles" ON profiles
  FOR ALL USING (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('owner', 'foreman')
  );

-- Workers can update their own profile (name, phone)
CREATE POLICY "update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- INVITATIONS
CREATE POLICY "select_company_invitations" ON invitations
  FOR SELECT USING (company_id = public.get_my_company_id());

CREATE POLICY "insert_company_invitations" ON invitations
  FOR INSERT WITH CHECK (
    company_id = public.get_my_company_id()
    AND public.get_my_role() IN ('owner', 'foreman')
  );

-- =============================================================================
-- AUTH TRIGGER: on_auth_user_created
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta JSONB;
  flow TEXT;
  new_company_id UUID;
BEGIN
  meta := NEW.raw_user_meta_data;
  flow := meta->>'flow';

  IF flow = 'register' THEN
    -- Create company and owner profile atomically
    INSERT INTO public.companies (name)
    VALUES (meta->>'company_name')
    RETURNING id INTO new_company_id;

    INSERT INTO public.profiles (id, company_id, role, first_name, last_name)
    VALUES (
      NEW.id,
      new_company_id,
      'owner',
      meta->>'first_name',
      meta->>'last_name'
    );

  ELSIF flow = 'invite' THEN
    -- Create profile from invitation metadata
    INSERT INTO public.profiles (id, company_id, role, first_name, last_name, invited_by)
    VALUES (
      NEW.id,
      (meta->>'company_id')::UUID,
      (meta->>'role')::user_role,
      meta->>'first_name',
      meta->>'last_name',
      (meta->>'invited_by')::UUID
    );
  END IF;

  -- For SSO without flow metadata: no automatic profile creation.
  -- The app redirects to registration if no profile is found.

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
