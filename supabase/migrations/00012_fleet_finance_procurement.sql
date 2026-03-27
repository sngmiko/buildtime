-- Enhanced fleet financing + procurement-to-project cost integration

-- Vehicle financing details
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS acquisition_type TEXT DEFAULT 'purchased' CHECK (acquisition_type IN ('purchased', 'leased', 'financed', 'rented'));
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS purchase_price DECIMAL(12,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS purchase_date DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS monthly_rate DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contract_start DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS contract_end DATE;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS down_payment DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS residual_value DECIMAL(10,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS interest_rate DECIMAL(5,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS loan_amount DECIMAL(12,2);
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS rental_daily_rate DECIMAL(10,2);

-- Link purchase orders to projects/orders
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id);

-- Link stock movements to projects/orders (for cost tracking)
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS order_id UUID REFERENCES orders(id);
ALTER TABLE stock_movements ADD COLUMN IF NOT EXISTS unit_price DECIMAL(10,2);
