-- Add password column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Insert default admin user (use gen_random_uuid for id)
INSERT INTO users (email, password, name, role, seller_code, is_active, permissions)
VALUES (
  'admin',
  'admin123',
  'مدير النظام',
  'admin',
  'ADMIN',
  true,
  '{"canCreateInvoice":true,"canPrintInvoices":true,"canReturns":true,"canAddItems":true,"canEditItems":true,"canDeleteItems":true,"canSearch":true,"canEnterData":true,"canViewFinancials":true,"canEditFinancials":true,"canViewTreasury":true,"canViewAnalysis":true,"canViewReports":true,"canAdjustPrices":true,"canManageUsers":true,"canManageOrders":true,"canArchive":true,"canPrintInventory":true}'
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  permissions = EXCLUDED.permissions,
  name = EXCLUDED.name,
  role = EXCLUDED.role;

-- Insert default seller user
INSERT INTO users (email, password, name, role, seller_code, is_active, permissions)
VALUES (
  'User1',
  'User456',
  'مستخدم 1',
  'seller',
  'U001',
  true,
  '{"canCreateInvoice":true,"canPrintInvoices":true,"canReturns":true,"canAddItems":false,"canEditItems":false,"canDeleteItems":false,"canSearch":true,"canEnterData":false,"canViewFinancials":false,"canEditFinancials":false,"canViewTreasury":false,"canViewAnalysis":false,"canViewReports":false,"canAdjustPrices":false,"canManageUsers":false,"canManageOrders":false,"canArchive":false,"canPrintInventory":true}'
)
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  permissions = EXCLUDED.permissions,
  name = EXCLUDED.name,
  role = EXCLUDED.role;
