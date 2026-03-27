-- Module 3: Inventory & Procurement Management

-- Suppliers
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  rating INTEGER CHECK (rating BETWEEN 1 AND 5),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Materials
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  article_number TEXT,
  unit TEXT NOT NULL DEFAULT 'piece' CHECK (unit IN ('piece','m','m2','m3','kg','l','pack')),
  price_per_unit DECIMAL(10,2),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  min_stock DECIMAL(10,2) DEFAULT 0,
  current_stock DECIMAL(10,2) DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'other' CHECK (category IN ('building_material','consumable','tool','small_parts','other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase orders
CREATE TABLE purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','ordered','partially_delivered','delivered','cancelled')),
  total_amount DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Purchase order items
CREATE TABLE purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  delivered_quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock movements
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  site_id UUID REFERENCES construction_sites(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('in','out','return')),
  quantity DECIMAL(10,2) NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_suppliers_company ON suppliers(company_id);
CREATE INDEX idx_materials_company ON materials(company_id);
CREATE INDEX idx_materials_supplier ON materials(supplier_id);
CREATE INDEX idx_purchase_orders_company ON purchase_orders(company_id);
CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_order_items_order ON purchase_order_items(order_id);
CREATE INDEX idx_purchase_order_items_material ON purchase_order_items(material_id);
CREATE INDEX idx_stock_movements_company ON stock_movements(company_id);
CREATE INDEX idx_stock_movements_material ON stock_movements(material_id);
CREATE INDEX idx_stock_movements_site ON stock_movements(site_id);

-- Triggers
CREATE TRIGGER suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER materials_updated_at BEFORE UPDATE ON materials FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER purchase_orders_updated_at BEFORE UPDATE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_company_suppliers" ON suppliers FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_suppliers" ON suppliers FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_materials" ON materials FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_materials" ON materials FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_purchase_orders" ON purchase_orders FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_purchase_orders" ON purchase_orders FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_order_items" ON purchase_order_items FOR SELECT USING (
  order_id IN (SELECT id FROM purchase_orders WHERE company_id = public.get_my_company_id())
);
CREATE POLICY "manage_company_order_items" ON purchase_order_items FOR ALL USING (
  order_id IN (SELECT id FROM purchase_orders WHERE company_id = public.get_my_company_id())
  AND public.get_my_role() IN ('owner', 'foreman')
);

CREATE POLICY "select_company_stock_movements" ON stock_movements FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_stock_movements" ON stock_movements FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));
