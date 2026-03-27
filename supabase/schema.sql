-- Kepler Express Ops - Supabase SQL Schema V1
-- Production-ready logistics operations database
-- Run in Supabase SQL Editor

-- =============================================================================
-- FUNCTIONS AND TRIGGERS
-- =============================================================================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================================================
-- PROFILES TABLE
-- Organization members and user management
-- =============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'driver' CHECK (role IN ('admin', 'manager', 'accountant', 'driver')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invited')),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX idx_profiles_status ON profiles(status);

-- RLS: Users can only view/edit their own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- =============================================================================
-- CLIENTS TABLE
-- Customer companies
-- =============================================================================

CREATE TABLE IF NOT EXISTS clients (
  client_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'FR',
  vat_number TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT client_email_org_unique UNIQUE (organization_id, email)
);

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_clients_organization_id ON clients(organization_id);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_name ON clients(name);

-- RLS: Users can only access clients from their organization
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view clients from their organization" ON clients
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins/managers can insert clients" ON clients
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Organization admins/managers can update clients" ON clients
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- =============================================================================
-- DRIVERS TABLE
-- Team members
-- =============================================================================

CREATE TABLE IF NOT EXISTS drivers (
  driver_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  license_number TEXT NOT NULL,
  license_expiry DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave', 'suspended')),
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT license_expiry_valid CHECK (license_expiry > CURRENT_DATE)
);

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_drivers_organization_id ON drivers(organization_id);
CREATE INDEX idx_drivers_status ON drivers(status);
CREATE INDEX idx_drivers_license_expiry ON drivers(license_expiry);

-- RLS: Users can view drivers from their organization
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view drivers from their organization" ON drivers
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins/managers can manage drivers" ON drivers
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- =============================================================================
-- VEHICLES TABLE
-- Fleet assets
-- =============================================================================

CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  name TEXT NOT NULL,
  license_plate TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('van', 'truck', 'car', 'trailer')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'watch', 'service_due', 'out_of_service', 'retired')),
  mileage_current INTEGER NOT NULL CHECK (mileage_current >= 0),
  mileage_last_service INTEGER NOT NULL DEFAULT 0 CHECK (mileage_last_service >= 0),
  next_service_mileage INTEGER NOT NULL CHECK (next_service_mileage > mileage_current),
  capacity_kg DECIMAL(10, 2),
  capacity_m3 DECIMAL(10, 2),
  last_service_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_license_plate UNIQUE (organization_id, license_plate)
);

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_vehicles_organization_id ON vehicles(organization_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_next_service_mileage ON vehicles(next_service_mileage);

-- RLS: Users can view vehicles from their organization
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vehicles from their organization" ON vehicles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins/managers can manage vehicles" ON vehicles
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- =============================================================================
-- MISSIONS TABLE
-- Transport jobs
-- =============================================================================

CREATE TABLE IF NOT EXISTS missions (
  mission_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE RESTRICT,
  driver_id UUID REFERENCES drivers(driver_id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
  reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'assigned', 'in_progress', 'delivered', 'issue', 'cancelled')),
  revenue_amount DECIMAL(12, 2) NOT NULL CHECK (revenue_amount > 0 AND revenue_amount <= 10000),
  estimated_cost_amount DECIMAL(12, 2) NOT NULL CHECK (estimated_cost_amount >= 0 AND estimated_cost_amount <= revenue_amount),
  actual_cost_amount DECIMAL(12, 2),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP')),
  departure_location TEXT NOT NULL,
  arrival_location TEXT NOT NULL,
  departure_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
  arrival_datetime TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT departure_ne_arrival CHECK (departure_location != arrival_location),
  CONSTRAINT reference_org_unique UNIQUE (organization_id, reference)
);

CREATE TRIGGER update_missions_updated_at BEFORE UPDATE ON missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_missions_organization_id ON missions(organization_id);
CREATE INDEX idx_missions_client_id ON missions(client_id);
CREATE INDEX idx_missions_driver_id ON missions(driver_id);
CREATE INDEX idx_missions_vehicle_id ON missions(vehicle_id);
CREATE INDEX idx_missions_status ON missions(status);
CREATE INDEX idx_missions_departure_datetime ON missions(departure_datetime);
CREATE INDEX idx_missions_created_at ON missions(created_at);

-- RLS: Users can view missions from their organization
ALTER TABLE missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view missions from their organization" ON missions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create/update missions" ON missions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update missions" ON missions
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- EXPENSES TABLE
-- Cost tracking
-- =============================================================================

CREATE TABLE IF NOT EXISTS expenses (
  expense_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  mission_id UUID REFERENCES missions(mission_id) ON DELETE SET NULL,
  driver_id UUID REFERENCES drivers(driver_id) ON DELETE SET NULL,
  vehicle_id UUID REFERENCES vehicles(vehicle_id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('fuel', 'tolls', 'maintenance', 'mission_expense', 'parking', 'other')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0 AND amount <= 5000),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP')),
  advanced_by_driver BOOLEAN NOT NULL DEFAULT FALSE,
  receipt_attached BOOLEAN NOT NULL DEFAULT FALSE,
  description TEXT,
  expense_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT driver_advance_requires_receipt CHECK (NOT advanced_by_driver OR receipt_attached)
);

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_expenses_organization_id ON expenses(organization_id);
CREATE INDEX idx_expenses_mission_id ON expenses(mission_id);
CREATE INDEX idx_expenses_driver_id ON expenses(driver_id);
CREATE INDEX idx_expenses_vehicle_id ON expenses(vehicle_id);
CREATE INDEX idx_expenses_type ON expenses(type);
CREATE INDEX idx_expenses_advanced_by_driver ON expenses(advanced_by_driver);
CREATE INDEX idx_expenses_expense_date ON expenses(expense_date);

-- RLS: Users can view expenses from their organization
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view expenses from their organization" ON expenses
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create/update expenses" ON expenses
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update expenses" ON expenses
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

-- =============================================================================
-- MAINTENANCE_RECORDS TABLE
-- Vehicle service history
-- =============================================================================

CREATE TABLE IF NOT EXISTS maintenance_records (
  maintenance_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('scheduled', 'unscheduled', 'repair', 'inspection')),
  description TEXT NOT NULL,
  cost_amount DECIMAL(10, 2) NOT NULL CHECK (cost_amount > 0),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP')),
  mileage_at_service INTEGER NOT NULL CHECK (mileage_at_service >= 0),
  next_service_mileage INTEGER NOT NULL CHECK (next_service_mileage > mileage_at_service),
  service_date DATE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_maintenance_records_vehicle_id ON maintenance_records(vehicle_id);
CREATE INDEX idx_maintenance_records_organization_id ON maintenance_records(organization_id);
CREATE INDEX idx_maintenance_records_service_date ON maintenance_records(service_date);

-- RLS: Users can view maintenance records from their organization
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view maintenance records from their organization" ON maintenance_records
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization admins/managers can manage maintenance" ON maintenance_records
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- =============================================================================
-- INVOICES TABLE
-- Client billing
-- =============================================================================

CREATE TABLE IF NOT EXISTS invoices (
  invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  client_id UUID NOT NULL REFERENCES clients(client_id) ON DELETE RESTRICT,
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'cancelled')),
  mission_ids UUID[] NOT NULL,
  amount_total DECIMAL(12, 2) NOT NULL CHECK (amount_total > 0),
  amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0 AND amount_paid <= amount_total),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP')),
  issued_date DATE NOT NULL,
  due_date DATE NOT NULL,
  sent_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT due_date_after_issued CHECK (due_date >= issued_date),
  CONSTRAINT invoice_number_org_unique UNIQUE (organization_id, invoice_number)
);

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at);

-- RLS: Users can view invoices from their organization
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices from their organization" ON invoices
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization accountants/managers can manage invoices" ON invoices
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'accountant')
    )
  );

-- =============================================================================
-- PAYMENTS TABLE
-- Payment records for invoices
-- =============================================================================

CREATE TABLE IF NOT EXISTS payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(invoice_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  amount DECIMAL(12, 2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'EUR' CHECK (currency IN ('EUR', 'USD', 'GBP')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('bank_transfer', 'check', 'cash', 'card', 'other')),
  payment_date DATE NOT NULL,
  reference TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_organization_id ON payments(organization_id);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);

-- RLS: Users can view payments from their organization
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payments from their organization" ON payments
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization accountants/managers can manage payments" ON payments
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE user_id = auth.uid() AND role IN ('admin', 'manager', 'accountant')
    )
  );

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Mission profitability view
CREATE OR REPLACE VIEW mission_profitability AS
SELECT 
  m.mission_id,
  m.organization_id,
  m.revenue_amount,
  m.estimated_cost_amount,
  COALESCE(m.actual_cost_amount, 
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE mission_id = m.mission_id),
    m.estimated_cost_amount
  ) as actual_cost,
  m.revenue_amount - m.estimated_cost_amount as estimated_margin,
  m.revenue_amount - COALESCE(m.actual_cost_amount,
    (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE mission_id = m.mission_id),
    m.estimated_cost_amount
  ) as actual_margin,
  ROUND(
    ((m.revenue_amount - COALESCE(m.actual_cost_amount,
      (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE mission_id = m.mission_id),
      m.estimated_cost_amount
    )) / m.revenue_amount * 100)::numeric, 2
  ) as margin_percentage
FROM missions m;

-- Invoice payment status view
CREATE OR REPLACE VIEW invoice_status_detail AS
SELECT 
  i.invoice_id,
  i.organization_id,
  i.status,
  i.amount_total,
  COALESCE(SUM(p.amount), 0) as total_paid,
  i.amount_total - COALESCE(SUM(p.amount), 0) as remaining_balance,
  ROUND((COALESCE(SUM(p.amount), 0) / i.amount_total * 100)::numeric, 2) as payment_percentage,
  CASE 
    WHEN COALESCE(SUM(p.amount), 0) >= i.amount_total THEN 'paid'
    WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'partial'
    WHEN i.due_date < CURRENT_DATE AND COALESCE(SUM(p.amount), 0) = 0 THEN 'overdue'
    WHEN i.status = 'sent' AND i.due_date >= CURRENT_DATE THEN 'sent'
    ELSE i.status
  END as calculated_status,
  i.due_date,
  CURRENT_DATE - i.due_date as days_overdue
FROM invoices i
LEFT JOIN payments p ON i.invoice_id = p.invoice_id
GROUP BY i.invoice_id, i.organization_id, i.status, i.amount_total, i.due_date;

-- Vehicle health view
CREATE OR REPLACE VIEW vehicle_health_status AS
SELECT
  v.vehicle_id,
  v.organization_id,
  v.name,
  v.mileage_current,
  v.next_service_mileage,
  v.next_service_mileage - v.mileage_current as mileage_until_service,
  CASE 
    WHEN v.mileage_current >= v.next_service_mileage THEN 'service_due'
    WHEN v.mileage_current >= (v.next_service_mileage - 2000) THEN 'watch'
    ELSE 'active'
  END as health_status,
  v.last_service_date,
  COUNT(m.mission_id) as missions_completed,
  COALESCE(SUM(e.amount), 0) as total_maintenance_cost
FROM vehicles v
LEFT JOIN missions m ON v.vehicle_id = m.vehicle_id AND m.status = 'delivered'
LEFT JOIN expenses e ON v.vehicle_id = e.vehicle_id AND e.type = 'maintenance'
GROUP BY v.vehicle_id, v.organization_id, v.name, v.mileage_current, v.next_service_mileage, v.last_service_date;

-- Driver performance view
CREATE OR REPLACE VIEW driver_performance AS
SELECT
  d.driver_id,
  d.organization_id,
  d.name,
  COUNT(CASE WHEN m.status = 'delivered' THEN 1 END) as missions_completed,
  COUNT(CASE WHEN m.status = 'in_progress' THEN 1 END) as missions_in_progress,
  SUM(CASE WHEN m.status = 'delivered' THEN m.revenue_amount ELSE 0 END) as total_revenue_driven,
  COALESCE(AVG(CASE WHEN m.status = 'delivered' THEN m.revenue_amount END), 0) as avg_mission_value,
  COALESCE(SUM(CASE WHEN e.advanced_by_driver THEN e.amount ELSE 0 END), 0) as total_advances,
  COUNT(DISTINCT m.mission_id) as total_missions_assigned
FROM drivers d
LEFT JOIN missions m ON d.driver_id = m.driver_id
LEFT JOIN expenses e ON d.driver_id = e.driver_id
GROUP BY d.driver_id, d.organization_id, d.name;

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================
