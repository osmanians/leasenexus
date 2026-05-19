-- LeaseNexus Enhanced Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- PROPERTIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID,
  address TEXT NOT NULL,
  city TEXT DEFAULT 'Windsor',
  province TEXT DEFAULT 'ON',
  postal_code TEXT,
  property_type TEXT,
  unit_count INTEGER DEFAULT 1,
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  monthly_rent NUMERIC(10,2),
  management_fee_pct NUMERIC(5,2) DEFAULT 10.0,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- LANDLORD PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS landlord_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  lead_id UUID REFERENCES leads(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TENANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE,
  lead_id UUID REFERENCES leads(id),
  property_id UUID REFERENCES properties(id),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  unit_number TEXT,
  lease_start DATE,
  lease_end DATE,
  monthly_rent NUMERIC(10,2),
  status TEXT DEFAULT 'active',
  emergency_contact TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link landlords to properties (one landlord can own multiple properties)
CREATE TABLE IF NOT EXISTS landlord_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID REFERENCES landlord_profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(landlord_id, property_id)
);

-- ============================================
-- SERVICE CALLS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS service_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  tenant_id UUID REFERENCES tenants(id),
  landlord_id UUID REFERENCES landlord_profiles(id),
  created_by_role TEXT NOT NULL DEFAULT 'tenant',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  assigned_to TEXT,
  estimated_cost NUMERIC(10,2),
  actual_cost NUMERIC(10,2),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Service call progress timeline
CREATE TABLE IF NOT EXISTS service_call_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_call_id UUID REFERENCES service_calls(id) ON DELETE CASCADE,
  updated_by TEXT NOT NULL,
  updated_by_role TEXT NOT NULL DEFAULT 'admin',
  status TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RENT LEDGER TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rent_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  tenant_id UUID REFERENCES tenants(id),
  period_month INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INTEGER NOT NULL,
  amount_due NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0,
  payment_date DATE,
  payment_method TEXT,
  late_fee NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, period_month, period_year)
);

-- ============================================
-- BUILDING PERFORMANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS building_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  occupancy_rate NUMERIC(5,2) DEFAULT 100.0,
  rent_collected NUMERIC(10,2) DEFAULT 0,
  rent_expected NUMERIC(10,2) DEFAULT 0,
  maintenance_costs NUMERIC(10,2) DEFAULT 0,
  management_fees NUMERIC(10,2) DEFAULT 0,
  other_expenses NUMERIC(10,2) DEFAULT 0,
  diy_estimated_cost NUMERIC(10,2) DEFAULT 0,
  savings_vs_diy NUMERIC(10,2) DEFAULT 0,
  service_calls_total INTEGER DEFAULT 0,
  service_calls_resolved INTEGER DEFAULT 0,
  avg_resolution_days NUMERIC(5,1),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, period_month, period_year)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_service_calls_property ON service_calls(property_id);
CREATE INDEX IF NOT EXISTS idx_service_calls_tenant ON service_calls(tenant_id);
CREATE INDEX IF NOT EXISTS idx_service_calls_status ON service_calls(status);
CREATE INDEX IF NOT EXISTS idx_rent_ledger_property ON rent_ledger(property_id);
CREATE INDEX IF NOT EXISTS idx_rent_ledger_tenant ON rent_ledger(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rent_ledger_period ON rent_ledger(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_building_perf ON building_performance(property_id, period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_tenants_property ON tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_email ON tenants(email);
CREATE INDEX IF NOT EXISTS idx_landlord_email ON landlord_profiles(email);
