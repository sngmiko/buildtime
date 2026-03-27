-- Separate employee from account
-- Employees can exist WITHOUT an auth account
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS has_account BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS guest_token TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_temporary BOOLEAN DEFAULT false;

-- Allow profiles to exist without auth.users reference for temporary workers
-- We keep the FK but allow NULL for temp workers managed by admin
ALTER TABLE profiles ALTER COLUMN id SET DEFAULT gen_random_uuid();
