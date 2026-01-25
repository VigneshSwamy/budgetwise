-- BudgetWise MVP - Initial Database Schema
-- Migration: 001_initial_schema.sql
-- Description: Creates all tables, indexes, and views for BudgetWise

-- ============================================================================
-- TABLES
-- ============================================================================

-- Profiles table (separate from auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Groups table
CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('couple', 'family', 'roommates', 'trip')),
  currency TEXT NOT NULL DEFAULT 'USD',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Group members table (many-to-many relationship)
CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Budget periods table (monthly budgets per group)
CREATE TABLE budget_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  period_key TEXT NOT NULL, -- e.g., '2026-01'
  budget_amount DECIMAL(12,2) NOT NULL CHECK (budget_amount >= 0),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, period_key)
);

-- Expense drafts table (draft expenses before confirmation)
CREATE TABLE expense_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  merchant TEXT,
  date DATE NOT NULL,
  period_key TEXT NOT NULL, -- derived from date or explicit override
  budget_impact BOOLEAN NOT NULL DEFAULT false,
  category TEXT, -- nullable
  category_source TEXT DEFAULT 'user' CHECK (category_source IN ('user', 'ocr', 'rule')),
  participants JSONB NOT NULL, -- e.g., [{"user_id": "...", "paid_amount": 100, "owed_amount": 50}, ...]
  source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'scan', 'voice', 'import')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'cancelled')),
  notes TEXT,
  receipt_url TEXT, -- reference to uploads/storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table (final confirmed expenses, normalized)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  draft_id UUID REFERENCES expense_drafts(id),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  merchant TEXT,
  date DATE NOT NULL,
  period_key TEXT NOT NULL, -- CRITICAL: every expense must have period_key
  budget_impact BOOLEAN NOT NULL,
  category TEXT,
  category_source TEXT DEFAULT 'user',
  source TEXT DEFAULT 'manual',
  notes TEXT,
  receipt_url TEXT,
  confirmed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expense payments table (who paid what, normalized from draft JSON)
CREATE TABLE expense_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  paid_amount DECIMAL(12,2) NOT NULL CHECK (paid_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);

-- Expense shares table (who owes what, normalized from draft JSON)
CREATE TABLE expense_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  owed_amount DECIMAL(12,2) NOT NULL CHECK (owed_amount >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(expense_id, user_id)
);

-- Uploads table (file uploads for receipts, statements)
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  group_id UUID REFERENCES groups(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL, -- Supabase Storage path
  mime_type TEXT,
  file_name TEXT,
  file_size BIGINT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table (notification preferences)
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  weekly_summary BOOLEAN DEFAULT false,
  budget_alert_threshold INTEGER DEFAULT 20, -- percentage
  budget_alert_enabled BOOLEAN DEFAULT true,
  settlement_reminder_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Groups indexes
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);

-- Budget indexes
CREATE INDEX idx_budget_periods_group_period ON budget_periods(group_id, period_key);

-- Expense indexes
CREATE INDEX idx_expenses_group_period ON expenses(group_id, period_key);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_period_budget_impact ON expenses(period_key, budget_impact) WHERE budget_impact = true;
CREATE INDEX idx_expense_payments_expense_id ON expense_payments(expense_id);
CREATE INDEX idx_expense_payments_user_id ON expense_payments(user_id);
CREATE INDEX idx_expense_shares_expense_id ON expense_shares(expense_id);
CREATE INDEX idx_expense_shares_user_id ON expense_shares(user_id);

-- Draft indexes
CREATE INDEX idx_expense_drafts_group_status ON expense_drafts(group_id, status);
CREATE INDEX idx_expense_drafts_created_by ON expense_drafts(created_by);

-- Upload indexes
CREATE INDEX idx_uploads_user_id ON uploads(user_id);
CREATE INDEX idx_uploads_group_id ON uploads(group_id);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Wallet remaining view (calculates wallet remaining per group + period)
CREATE VIEW wallet_remaining AS
SELECT 
  bp.group_id,
  bp.period_key,
  bp.budget_amount,
  COALESCE(SUM(e.amount) FILTER (WHERE e.budget_impact = true), 0) AS spent_amount,
  (bp.budget_amount - COALESCE(SUM(e.amount) FILTER (WHERE e.budget_impact = true), 0)) AS remaining_amount
FROM budget_periods bp
LEFT JOIN expenses e ON e.group_id = bp.group_id AND e.period_key = bp.period_key
GROUP BY bp.group_id, bp.period_key, bp.budget_amount;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_expense_drafts_updated_at
  BEFORE UPDATE ON expense_drafts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();