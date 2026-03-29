-- Company branding
ALTER TABLE companies ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#1e3a5f';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#f59e0b';
-- logo_url already exists from migration 00011
