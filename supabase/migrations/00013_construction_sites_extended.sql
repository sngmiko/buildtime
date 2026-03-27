-- Enhanced Construction Sites

-- Extend construction_sites with project details
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS client_phone TEXT;
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS budget DECIMAL(12,2);
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS site_manager UUID REFERENCES profiles(id);
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
