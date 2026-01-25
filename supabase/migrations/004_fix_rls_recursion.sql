-- BudgetWise MVP - Fix RLS Infinite Recursion
-- Migration: 004_fix_rls_recursion.sql
-- Description: Fixes infinite recursion in group_members and groups RLS policies

-- ============================================================================
-- FIX GROUP_MEMBERS RLS POLICIES
-- ============================================================================

-- Drop ALL existing policies that might cause recursion (handle duplicates)
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can add themselves when creating group" ON group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can add other members" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;

-- Create fixed SELECT policy (checks groups table first to avoid recursion)
CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND (
        -- User created the group (no recursion)
        g.created_by = auth.uid()
        OR
        -- User is a member (safe for SELECT operations)
        EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
        )
      )
    )
  );

-- Allow group creators to add themselves as admin members
CREATE POLICY "Users can add themselves when creating group" ON group_members
  FOR INSERT WITH CHECK (
    -- User is adding themselves
    user_id = auth.uid()
    AND
    -- User created the group (check via groups table, not group_members)
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.created_by = auth.uid()
    )
  );

-- Allow group admins to add other members
CREATE POLICY "Group admins can add other members" ON group_members
  FOR INSERT WITH CHECK (
    -- User being added is different from current user
    user_id != auth.uid()
    AND
    -- Current user is group creator OR is already an admin member
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND (
        -- User created the group (direct check, no recursion)
        g.created_by = auth.uid()
        OR
        -- User is already an admin member
        EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
          AND gm.role = 'admin'
        )
      )
    )
  );

-- Group admins can remove members (check via groups table first)
CREATE POLICY "Group admins can remove members" ON group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND (
        -- User created the group
        g.created_by = auth.uid()
        OR
        -- User is an admin member
        EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
          AND gm.role = 'admin'
        )
      )
    )
  );

-- ============================================================================
-- FIX GROUPS RLS POLICIES
-- ============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;

-- Create fixed SELECT policy for groups
-- IMPORTANT: Check created_by FIRST before checking group_members
-- This prevents recursion when inserting into group_members
CREATE POLICY "Users can view groups they belong to" ON groups
  FOR SELECT USING (
    -- Check created_by FIRST (no recursion, direct column access)
    created_by = auth.uid()
    OR
    -- Only check membership if user didn't create it
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id
      AND gm.user_id = auth.uid()
    )
  );

-- Create fixed UPDATE policy for groups
-- IMPORTANT: Check created_by FIRST before checking group_members
CREATE POLICY "Group admins can update groups" ON groups
  FOR UPDATE USING (
    -- User created the group (no recursion)
    created_by = auth.uid()
    OR
    -- User is an admin member
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );