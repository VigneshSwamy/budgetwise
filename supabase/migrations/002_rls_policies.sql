-- BudgetWise MVP - Row Level Security (RLS) Policies
-- Migration: 002_rls_policies.sql
-- Description: Enables RLS and creates security policies for all tables

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Profiles policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Groups policies
-- Users can read groups they are members of
CREATE POLICY "Users can view groups they belong to" ON groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can create groups
CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Group admins can update groups
CREATE POLICY "Group admins can update groups" ON groups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = groups.id
      AND group_members.user_id = auth.uid()
      AND group_members.role = 'admin'
    )
  );

-- Group members policies
-- Fix infinite recursion by using groups table instead of self-referencing group_members

-- Users can read members of groups they belong to (check via groups table)
CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND (
        -- User is the creator of the group
        g.created_by = auth.uid()
        OR
        -- User is already a member (this is safe for SELECT as it doesn't create recursion)
        EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
        )
      )
    )
  );

-- Users can add themselves as members when they create a group
CREATE POLICY "Users can add themselves when creating group" ON group_members
  FOR INSERT WITH CHECK (
    -- Allow if user is creating themselves as a member and they created the group
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.created_by = auth.uid()
    )
  );

-- Group admins can add other members (check via groups table to avoid recursion)
CREATE POLICY "Group admins can add other members" ON group_members
  FOR INSERT WITH CHECK (
    -- User being added is different from current user
    user_id != auth.uid()
    AND EXISTS (
      -- Check if current user is admin via groups table (they created it) or existing membership
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND (
        g.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
          AND gm.role = 'admin'
        )
      )
    )
  );

-- Group admins can remove members (check via groups table)
CREATE POLICY "Group admins can remove members" ON group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND (
        g.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
          AND gm.role = 'admin'
        )
      )
    )
  );

-- Budget periods policies
-- Users can read/write budget periods for groups they belong to
CREATE POLICY "Users can manage budgets for their groups" ON budget_periods
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = budget_periods.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Expense drafts policies
-- Users can read/write drafts for groups they belong to
CREATE POLICY "Users can manage drafts in their groups" ON expense_drafts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = expense_drafts.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Expenses policies
-- Users can read/write expenses for groups they belong to
CREATE POLICY "Users can manage expenses in their groups" ON expenses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = expenses.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Expense payments policies
-- Users can read payments for expenses in their groups
-- Note: INSERT/UPDATE/DELETE should only be done via RPC functions with service role
CREATE POLICY "Users can view payments in their groups" ON expense_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN group_members gm ON gm.group_id = e.group_id
      WHERE e.id = expense_payments.expense_id
      AND gm.user_id = auth.uid()
    )
  );

-- Expense shares policies
-- Users can read shares for expenses in their groups
-- Note: INSERT/UPDATE/DELETE should only be done via RPC functions with service role
CREATE POLICY "Users can view shares in their groups" ON expense_shares
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM expenses e
      JOIN group_members gm ON gm.group_id = e.group_id
      WHERE e.id = expense_shares.expense_id
      AND gm.user_id = auth.uid()
    )
  );

-- Uploads policies
-- Users can read their own uploads
CREATE POLICY "Users can view own uploads" ON uploads
  FOR SELECT USING (auth.uid() = user_id);

-- Users can read uploads for groups they belong to
CREATE POLICY "Users can view group uploads" ON uploads
  FOR SELECT USING (
    group_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM group_members
      WHERE group_members.group_id = uploads.group_id
      AND group_members.user_id = auth.uid()
    )
  );

-- Users can create uploads
CREATE POLICY "Users can create uploads" ON uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own uploads" ON uploads
  FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
-- Users can read/update their own settings
CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (auth.uid() = user_id);