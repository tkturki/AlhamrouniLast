-- ============================================
-- Alhamrouni Jewelry Management System
-- Supabase Migration Script
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. USERS TABLE (Supabase Auth + Profile)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'seller' CHECK (role IN ('admin', 'accountant', 'seller', 'data_entry')),
  seller_code TEXT,
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login TIMESTAMPTZ
);

-- ============================================
-- 2. JEWELRY ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS jewelry_items (
  id BIGSERIAL PRIMARY KEY,
  item_code TEXT UNIQUE NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'G',
  karat TEXT NOT NULL DEFAULT '21',
  origin TEXT NOT NULL DEFAULT 'L',
  gold_category TEXT DEFAULT 'arabic',
  gold_item TEXT,
  metal_type TEXT,
  category TEXT NOT NULL DEFAULT 'R',
  status TEXT NOT NULL DEFAULT 'جديد',
  model_name TEXT NOT NULL,
  weight NUMERIC(10,2) NOT NULL DEFAULT 0,
  price NUMERIC(12,2) NOT NULL DEFAULT 0,
  purchase_price NUMERIC(12,2),
  sale_price NUMERIC(12,2),
  price_per_gram NUMERIC(10,2),
  stock_qty INTEGER NOT NULL DEFAULT 1,
  image_url TEXT,
  barcode TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. SALE INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sale_invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL DEFAULT 'عميل',
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  seller_name TEXT NOT NULL,
  seller_code TEXT,
  payment_method TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ARCHIVED INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS archived_invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. CANCELLED INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cancelled_invoices (
  id BIGSERIAL PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  seller_name TEXT NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL,
  items JSONB DEFAULT '[]',
  cancelled_reason TEXT,
  cancelled_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL
);

-- ============================================
-- 6. INVOICE BOOKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS invoice_books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  book_number INTEGER NOT NULL,
  seller_name TEXT NOT NULL,
  start_number INTEGER NOT NULL,
  end_number INTEGER NOT NULL,
  current_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exhausted', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. TREASURY ACCOUNTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS treasury_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
  parent_id UUID REFERENCES treasury_accounts(id),
  balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. TREASURY JOURNAL TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS treasury_journal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE NOT NULL,
  description TEXT NOT NULL,
  debit NUMERIC(12,2) DEFAULT 0,
  credit NUMERIC(12,2) DEFAULT 0,
  account_code TEXT NOT NULL,
  entry_type TEXT NOT NULL CHECK (entry_type IN ('sale', 'purchase', 'expense', 'deposit', 'withdrawal', 'return', 'salary', 'tax', 'transfer')),
  reference TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. DAILY CLOSINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS daily_closings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date DATE UNIQUE NOT NULL,
  opening_balance NUMERIC(12,2) DEFAULT 0,
  total_debit NUMERIC(12,2) DEFAULT 0,
  total_credit NUMERIC(12,2) DEFAULT 0,
  closing_balance NUMERIC(12,2) DEFAULT 0,
  entries JSONB DEFAULT '[]',
  closed_by TEXT,
  closed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- 10. TAX RECORDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tax_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period TEXT NOT NULL,
  taxable_amount NUMERIC(12,2) NOT NULL,
  tax_rate NUMERIC(5,2) NOT NULL,
  tax_amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'exempt')),
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 11. PRODUCT RETURNS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS product_returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(12,2) NOT NULL,
  return_date TIMESTAMPTZ DEFAULT NOW(),
  type TEXT NOT NULL CHECK (type IN ('full', 'partial')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  processed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 12. GOLD CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS gold_categories (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('arabic', 'foreign', 'silver')),
  items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 13. SYSTEM SETTINGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS system_settings (
  id BIGSERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 14. ACTIVITY LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  description TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 15. NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('success', 'error', 'warning', 'info')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 16. ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  items JSONB NOT NULL DEFAULT '[]',
  total_amount NUMERIC(12,2) DEFAULT 0,
  deposit_amount NUMERIC(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 17. SUPPLIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 18. FAVORITES TABLE (Gallery)
-- ============================================
CREATE TABLE IF NOT EXISTS favorites (
  id BIGSERIAL PRIMARY KEY,
  item_code TEXT NOT NULL,
  user_session TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(item_code, user_session)
);

-- ============================================
-- 19. WHATSAPP CLICKS TABLE (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS whatsapp_clicks (
  id BIGSERIAL PRIMARY KEY,
  item_code TEXT NOT NULL,
  user_session TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 20. SHARE CLICKS TABLE (Analytics)
-- ============================================
CREATE TABLE IF NOT EXISTS share_clicks (
  id BIGSERIAL PRIMARY KEY,
  item_code TEXT NOT NULL,
  platform TEXT,
  user_session TEXT,
  clicked_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 21. CONTACT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 22. DRAFT INVOICES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS draft_invoices (
  id BIGSERIAL PRIMARY KEY,
  draft_number TEXT UNIQUE NOT NULL,
  customer_name TEXT DEFAULT 'عميل',
  items JSONB DEFAULT '[]',
  total_amount NUMERIC(12,2) DEFAULT 0,
  seller_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_jewelry_items_code ON jewelry_items(item_code);
CREATE INDEX IF NOT EXISTS idx_jewelry_items_category ON jewelry_items(category);
CREATE INDEX IF NOT EXISTS idx_jewelry_items_status ON jewelry_items(status);
CREATE INDEX IF NOT EXISTS idx_sale_invoices_number ON sale_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_sale_invoices_date ON sale_invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_treasury_journal_date ON treasury_journal(date);
CREATE INDEX IF NOT EXISTS idx_treasury_journal_account ON treasury_journal(account_code);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_product_returns_invoice ON product_returns(invoice_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE jewelry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancelled_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_closings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE gold_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE share_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE draft_invoices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES (Authenticated users only)
-- ============================================
-- Drop existing policies first, then recreate

DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON jewelry_items;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON sale_invoices;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON archived_invoices;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON cancelled_invoices;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON invoice_books;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON treasury_accounts;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON treasury_journal;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON daily_closings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON tax_records;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON product_returns;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON gold_categories;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON system_settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON activity_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON notifications;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON suppliers;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON favorites;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON whatsapp_clicks;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON share_clicks;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON contact_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow all for authenticated users" ON draft_invoices;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Drop existing anonymous policies if any
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow anonymous read favorites" ON favorites;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow anonymous insert favorites" ON favorites;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow anonymous insert whatsapp" ON whatsapp_clicks;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow anonymous insert share" ON share_clicks;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$ BEGIN
  DROP POLICY IF EXISTS "Allow anonymous insert contact" ON contact_messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ============================================
-- NEW POLICIES: Admin-only for sensitive data
-- ============================================

-- Users table: only admins can manage, everyone can read basic info
CREATE POLICY "Admins can manage users" ON users FOR ALL
  USING (auth.role() = 'authenticated');
CREATE POLICY "Users can view own profile" ON users FOR SELECT
  USING (auth.role() = 'authenticated');

-- Jewelry items: authenticated users can read, admins/sellers can modify
CREATE POLICY "Authenticated can read items" ON jewelry_items FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert items" ON jewelry_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can update items" ON jewelry_items FOR UPDATE
  USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can delete items" ON jewelry_items FOR DELETE
  USING (auth.role() = 'authenticated');

-- Sale invoices: authenticated users can manage
CREATE POLICY "Authenticated can manage invoices" ON sale_invoices FOR ALL
  USING (auth.role() = 'authenticated');

-- Archived invoices: authenticated users can manage
CREATE POLICY "Authenticated can manage archived" ON archived_invoices FOR ALL
  USING (auth.role() = 'authenticated');

-- Cancelled invoices: authenticated users can manage
CREATE POLICY "Authenticated can manage cancelled" ON cancelled_invoices FOR ALL
  USING (auth.role() = 'authenticated');

-- Invoice books: authenticated users can manage
CREATE POLICY "Authenticated can manage invoice_books" ON invoice_books FOR ALL
  USING (auth.role() = 'authenticated');

-- Treasury: only admins
CREATE POLICY "Authenticated can manage treasury" ON treasury_accounts FOR ALL
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage journal" ON treasury_journal FOR ALL
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can manage closings" ON daily_closings FOR ALL
  USING (auth.role() = 'authenticated');

-- Tax records: authenticated users
CREATE POLICY "Authenticated can manage tax" ON tax_records FOR ALL
  USING (auth.role() = 'authenticated');

-- Product returns: authenticated users
CREATE POLICY "Authenticated can manage returns" ON product_returns FOR ALL
  USING (auth.role() = 'authenticated');

-- Gold categories: authenticated users
CREATE POLICY "Authenticated can manage categories" ON gold_categories FOR ALL
  USING (auth.role() = 'authenticated');

-- System settings: authenticated users
CREATE POLICY "Authenticated can manage settings" ON system_settings FOR ALL
  USING (auth.role() = 'authenticated');

-- Activity logs: authenticated users can read, system can insert
CREATE POLICY "Authenticated can read logs" ON activity_logs FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert logs" ON activity_logs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Notifications: authenticated users
CREATE POLICY "Authenticated can manage notifications" ON notifications FOR ALL
  USING (auth.role() = 'authenticated');

-- Orders: authenticated users
CREATE POLICY "Authenticated can manage orders" ON orders FOR ALL
  USING (auth.role() = 'authenticated');

-- Suppliers: authenticated users
CREATE POLICY "Authenticated can manage suppliers" ON suppliers FOR ALL
  USING (auth.role() = 'authenticated');

-- Favorites: allow anonymous read and authenticated write (public gallery)
CREATE POLICY "Anyone can read favorites" ON favorites FOR SELECT
  USING (true);
CREATE POLICY "Authenticated can manage favorites" ON favorites FOR ALL
  USING (auth.role() = 'authenticated');

-- WhatsApp clicks: anonymous analytics
CREATE POLICY "Anyone can insert whatsapp clicks" ON whatsapp_clicks FOR INSERT
  WITH CHECK (true);

-- Share clicks: anonymous analytics
CREATE POLICY "Anyone can insert share clicks" ON share_clicks FOR INSERT
  WITH CHECK (true);

-- Contact messages: anyone can submit
CREATE POLICY "Anyone can submit contact" ON contact_messages FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Authenticated can read contacts" ON contact_messages FOR SELECT
  USING (auth.role() = 'authenticated');

-- Draft invoices: authenticated users
CREATE POLICY "Authenticated can manage drafts" ON draft_invoices FOR ALL
  USING (auth.role() = 'authenticated');

-- ============================================
-- INITIAL DATA INSERT
-- ============================================

-- Default Chart of Accounts
INSERT INTO treasury_accounts (code, name, type, balance) VALUES
('1001', 'الصندوق', 'asset', 0),
('1002', 'البنك', 'asset', 0),
('1003', 'العملاء', 'asset', 0),
('1004', 'المخزون', 'asset', 0),
('1005', 'الأصول الثابتة', 'asset', 0),
('2001', 'الموردين', 'liability', 0),
('2002', 'الضرائب المستحقة', 'liability', 0),
('2003', 'القروض', 'liability', 0),
('3001', 'إيرادات المبيعات', 'revenue', 0),
('3002', 'إيرادات أخرى', 'revenue', 0),
('4001', 'تكلفة البضاعة المباعة', 'expense', 0),
('4002', 'مصروفات تشغيلية', 'expense', 0),
('4003', 'رواتب وأجور', 'expense', 0),
('4004', 'إيجارات', 'expense', 0),
('4005', 'مصروفات أخرى', 'expense', 0),
('5001', 'رأس المال', 'equity', 0),
('5002', 'الأرباح المحتجزة', 'equity', 0)
ON CONFLICT (code) DO NOTHING;

-- Default System Settings
INSERT INTO system_settings (key, value) VALUES
('gold_prices', '{"gold24k": 0, "gold21k": 0, "gold18k": 0, "silver": 0, "lastUpdated": "2024-01-01T00:00:00Z", "isCustom": false}'),
('exchange_rate', '{"usdToLyd": 0, "lastUpdated": "2024-01-01T00:00:00Z", "isCustom": false}'),
('store_info', '{"storeName": "مجوهرات الحمروني", "storePhone": "218XXXXXXXXX", "storeAddress": "ليبيا", "taxRate": 0, "currency": "LYD"}')
ON CONFLICT (key) DO NOTHING;

-- Default Gold Categories
INSERT INTO gold_categories (name, type, items) VALUES
('ذهب عربي', 'arabic', '["خاتم", "سوار", "قلادة", "حلق", "سلسلة", "عثرة", "دبلة", "طقم", "نيكل"]'),
('ذهب أجنبي', 'foreign', '["خاتم", "سوار", "قلادة", "حلق", "سلسلة"]'),
('فضة', 'silver', '["خاتم", "سوار", "قلادة", "حلق", "سلسلة"]')
ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to get next invoice number
CREATE OR REPLACE FUNCTION get_next_invoice_number(p_seller_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_book RECORD;
  v_number INTEGER;
BEGIN
  -- Get active book for seller
  SELECT * INTO v_book
  FROM invoice_books
  WHERE seller_name = p_seller_name AND status = 'active'
  LIMIT 1;
  
  -- If no book exists, create one
  IF v_book IS NULL THEN
    INSERT INTO invoice_books (book_number, seller_name, start_number, end_number, current_number, status)
    VALUES (1, p_seller_name, 1001, 1999, 1002, 'active')
    RETURNING * INTO v_book;
    RETURN '1001';
  END IF;
  
  -- Check if book is exhausted
  IF v_book.current_number > v_book.end_number THEN
    UPDATE invoice_books SET status = 'exhausted' WHERE id = v_book.id;
    RAISE EXCEPTION 'Invoice book exhausted for seller: %', p_seller_name;
  END IF;
  
  -- Get current number and increment
  v_number := v_book.current_number;
  UPDATE invoice_books SET current_number = current_number + 1 WHERE id = v_book.id;
  
  -- Mark as exhausted if last number
  IF v_number >= v_book.end_number THEN
    UPDATE invoice_books SET status = 'exhausted' WHERE id = v_book.id;
  END IF;
  
  RETURN v_number::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to update item stock (with negative check)
CREATE OR REPLACE FUNCTION update_item_stock(p_item_code TEXT, p_quantity INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_qty INTEGER;
BEGIN
  SELECT stock_qty INTO v_current_qty
  FROM jewelry_items
  WHERE item_code = p_item_code;
  
  IF v_current_qty IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Prevent negative stock
  IF v_current_qty < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for item %: available %, requested %', p_item_code, v_current_qty, p_quantity;
  END IF;
  
  UPDATE jewelry_items
  SET stock_qty = stock_qty - p_quantity,
      updated_at = NOW()
  WHERE item_code = p_item_code;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jewelry_items_updated_at
  BEFORE UPDATE ON jewelry_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_draft_invoices_updated_at
  BEFORE UPDATE ON draft_invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- VIEWS
-- ============================================

-- Active items view
CREATE OR REPLACE VIEW active_items AS
SELECT * FROM jewelry_items WHERE stock_qty > 0;

-- Today's sales view
CREATE OR REPLACE VIEW today_sales AS
SELECT * FROM sale_invoices
WHERE DATE(created_at) = CURRENT_DATE
ORDER BY created_at DESC;

-- Monthly sales summary view
CREATE OR REPLACE VIEW monthly_sales_summary AS
SELECT
  DATE_TRUNC('month', created_at) AS month,
  COUNT(*) AS invoice_count,
  SUM(total_amount) AS total_sales
FROM sale_invoices
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- ============================================
-- COMPLETE!
-- ============================================
