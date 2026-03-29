-- Phase 7-10: Maps, Worker, Lager Bündel, Bautagesbericht Docs

-- Phase 8: Baustellen-Kontakt
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS contact_name TEXT;
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE construction_sites ADD COLUMN IF NOT EXISTS contact_role TEXT;

-- Phase 8: Firma-Einstellung für freie Baustellenwahl
ALTER TABLE companies ADD COLUMN IF NOT EXISTS allow_free_site_selection BOOLEAN DEFAULT true;

-- Phase 9: Material Bündel
CREATE TABLE material_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE material_bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES material_bundles(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES materials(id),
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bundles_company ON material_bundles(company_id);
CREATE INDEX idx_bundle_items ON material_bundle_items(bundle_id);

CREATE TRIGGER bundles_updated_at BEFORE UPDATE ON material_bundles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE material_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_bundle_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_company_bundles" ON material_bundles FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_bundles" ON material_bundles FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman', 'super_admin'));
CREATE POLICY "select_bundle_items" ON material_bundle_items FOR SELECT USING (EXISTS (SELECT 1 FROM material_bundles WHERE material_bundles.id = material_bundle_items.bundle_id AND material_bundles.company_id = public.get_my_company_id()));
CREATE POLICY "manage_bundle_items" ON material_bundle_items FOR ALL USING (EXISTS (SELECT 1 FROM material_bundles WHERE material_bundles.id = material_bundle_items.bundle_id AND material_bundles.company_id = public.get_my_company_id()) AND public.get_my_role() IN ('owner', 'foreman', 'super_admin'));

-- Phase 10: Diary documents
CREATE TABLE diary_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  site_id UUID REFERENCES construction_sites(id),
  diary_entry_id UUID REFERENCES diary_entries(id),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diary_docs_entry ON diary_documents(diary_entry_id);
CREATE INDEX idx_diary_docs_site ON diary_documents(site_id);

ALTER TABLE diary_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_company_diary_docs" ON diary_documents FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_diary_docs" ON diary_documents FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman', 'super_admin'));
