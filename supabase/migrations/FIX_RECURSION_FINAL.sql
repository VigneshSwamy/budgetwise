-- ============================================================================
-- FINAL FIX - NO RECURSION - Copy entire file into Supabase SQL Editor
-- ============================================================================

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Group admins can add other members" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;
DROP POLICY IF EXISTS "Users can add themselves when creating group" ON group_members;
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;

-- SELECT policy: ONLY check groups.created_by OR user viewing themselves
-- NO group_members EXISTS checks to prevent recursion
CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT USING (
    -- User created the group (direct check, no recursion)
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.created_by = auth.uid()
    )
    OR
    -- User is viewing themselves as a member (direct column check, no recursion)
    user_id = auth.uid()
  );

-- INSERT policy: ONLY check groups.created_by - NO group_members check during INSERT
CREATE POLICY "Users can add themselves when creating group" ON group_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.created_by = auth.uid()
    )
  );

-- INSERT for other members: Only check if current user is group creator
-- NO checking of existing group_members to avoid recursion
CREATE POLICY "Group admins can add other members" ON group_members
  FOR INSERT WITH CHECK (
    user_id != auth.uid()
    AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.created_by = auth.uid()
    )
  );

-- DELETE: Only group creator can delete members (no recursion)
CREATE POLICY "Group admins can remove members" ON group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND g.created_by = auth.uid()
    )
  );

-- ============================================================================
-- This fix ensures:
-- 1. INSERT policies ONLY check groups.created_by (NO group_members checks)
-- 2. SELECT policy checks groups.created_by FIRST
-- 3. NO circular dependencies
-- ============================================================================