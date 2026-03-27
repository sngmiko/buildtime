-- Module 6: Construction Diary

CREATE TABLE diary_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  site_id UUID NOT NULL REFERENCES construction_sites(id),
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  weather TEXT,
  temperature INTEGER,
  wind TEXT,
  work_description TEXT NOT NULL,
  incidents TEXT,
  defects TEXT,
  hindrances TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(site_id, entry_date)
);

CREATE TABLE diary_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diary_entry_id UUID NOT NULL REFERENCES diary_entries(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diary_site ON diary_entries(site_id, entry_date);
CREATE INDEX idx_diary_company ON diary_entries(company_id);
CREATE INDEX idx_diary_photos ON diary_photos(diary_entry_id);
CREATE TRIGGER diary_updated_at BEFORE UPDATE ON diary_entries FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE diary_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_company_diary" ON diary_entries FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_diary" ON diary_entries FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));
CREATE POLICY "select_diary_photos" ON diary_photos FOR SELECT USING (
  EXISTS (SELECT 1 FROM diary_entries WHERE diary_entries.id = diary_photos.diary_entry_id AND diary_entries.company_id = public.get_my_company_id())
);
CREATE POLICY "manage_diary_photos" ON diary_photos FOR ALL USING (
  EXISTS (SELECT 1 FROM diary_entries WHERE diary_entries.id = diary_photos.diary_entry_id AND diary_entries.company_id = public.get_my_company_id())
  AND public.get_my_role() IN ('owner', 'foreman')
);
