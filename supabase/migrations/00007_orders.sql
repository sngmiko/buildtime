-- Module 4: Order/Project Management

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders/Projects
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  site_id UUID REFERENCES construction_sites(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'quote' CHECK (status IN ('quote','commissioned','in_progress','acceptance','completed','complaint')),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Quote/Offer line items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'Stk',
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resource assignments (people, vehicles, equipment to orders)
CREATE TABLE order_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('employee','vehicle','equipment')),
  resource_id UUID NOT NULL,
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- External costs (subcontractor invoices, other)
CREATE TABLE order_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('subcontractor','material','equipment','vehicle','other')),
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_customers_company ON customers(company_id);
CREATE INDEX idx_orders_company ON orders(company_id);
CREATE INDEX idx_orders_status ON orders(company_id, status);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_order_items ON order_items(order_id);
CREATE INDEX idx_assignments ON order_assignments(order_id);
CREATE INDEX idx_order_costs ON order_costs(order_id);

-- Triggers
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_costs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_company_customers" ON customers FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_customers" ON customers FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

CREATE POLICY "select_company_orders" ON orders FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_company_orders" ON orders FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));

-- Order items/assignments/costs inherit access from parent order via join
CREATE POLICY "select_order_items" ON order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.company_id = public.get_my_company_id())
);
CREATE POLICY "manage_order_items" ON order_items FOR ALL USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.company_id = public.get_my_company_id())
  AND public.get_my_role() IN ('owner', 'foreman')
);

CREATE POLICY "select_assignments" ON order_assignments FOR SELECT USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_assignments.order_id AND orders.company_id = public.get_my_company_id())
);
CREATE POLICY "manage_assignments" ON order_assignments FOR ALL USING (
  EXISTS (SELECT 1 FROM orders WHERE orders.id = order_assignments.order_id AND orders.company_id = public.get_my_company_id())
  AND public.get_my_role() IN ('owner', 'foreman')
);

CREATE POLICY "select_order_costs" ON order_costs FOR SELECT USING (company_id = public.get_my_company_id());
CREATE POLICY "manage_order_costs" ON order_costs FOR ALL USING (company_id = public.get_my_company_id() AND public.get_my_role() IN ('owner', 'foreman'));
