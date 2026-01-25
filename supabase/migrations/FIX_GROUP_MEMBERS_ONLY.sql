-- ============================================================================
-- FIX GROUP_MEMBERS POLICIES ONLY
-- ============================================================================
-- The groups policies are already fixed, so we only need to fix group_members
-- Copy and paste this into Supabase SQL Editor
-- ============================================================================

-- First, check what group_members policies exist
-- (You should run CHECK_POLICIES.sql to see them, but we'll drop all possible names)

-- Drop all possible group_members policies
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can add themselves when creating group" ON group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can add other members" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;

-- Now create the fixed policies

-- Users can view members of groups they created OR belong to
CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND (
        g.created_by = auth.uid()
        OR EXISTS (
          SELECT 1 FROM group_members gm
          WHERE gm.group_id = group_members.group_id
          AND gm.user_id = auth.uid()
        )
      )
    )
  );

-- Users can add themselves when creating a group
CREATE POLICY "Users can add themselves when creating group" ON group_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.created_by = auth.uid()
    )
  );

-- Group admins can add other members
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
-- DONE! Group_members policies are now fixed.
-- The groups policies are already correct (checking created_by first).
-- ============================================================================