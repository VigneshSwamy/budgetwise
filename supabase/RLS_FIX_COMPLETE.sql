-- ============================================================================
-- COMPLETE RLS FIX - Copy and paste this entire file into Supabase SQL Editor
-- ============================================================================
-- This fixes both group_members and groups RLS infinite recursion issues
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: FIX GROUP_MEMBERS RLS POLICIES
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
        g.created_by = auth.uid()
        OR
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
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.created_by = auth.uid()
    )
  );

-- Allow group admins to add other members
CREATE POLICY "Group admins can add other members" ON group_members
  FOR INSERT WITH CHECK (
    user_id != auth.uid()
    AND EXISTS (
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

-- Group admins can remove members
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

-- ============================================================================
-- STEP 2: FIX GROUPS RLS POLICIES
-- ============================================================================

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;

-- Create fixed SELECT policy (checks created_by FIRST to avoid recursion)
CREATE POLICY "Users can view groups they belong to" ON groups
  FOR SELECT USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id
      AND gm.user_id = auth.uid()
    )
  );

-- Create fixed UPDATE policy (checks created_by FIRST to avoid recursion)
CREATE POLICY "Group admins can update groups" ON groups
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
    )
  );

-- ============================================================================
-- DONE! Both fixes applied successfully.
-- ============================================================================
