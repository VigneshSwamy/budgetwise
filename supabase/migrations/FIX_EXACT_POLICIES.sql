-- ============================================================================
-- FIX EXACT POLICIES - Uses the exact policy names you provided
-- ============================================================================
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================================================

-- Drop the existing policies with their exact names
DROP POLICY IF EXISTS "Group admins can add other members" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;
DROP POLICY IF EXISTS "Users can add themselves when creating group" ON group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;

-- Create fixed policies that check groups table first (no recursion)

-- Policy 1: View members
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

-- Policy 2: Add themselves when creating group
CREATE POLICY "Users can add themselves when creating group" ON group_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.created_by = auth.uid()
    )
  );

-- Policy 3: Add other members
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

-- Policy 4: Remove members
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
-- DONE! All 4 policies have been dropped and recreated with fixed logic.
-- The groups policies are already correct (checking created_by first).
-- ============================================================================