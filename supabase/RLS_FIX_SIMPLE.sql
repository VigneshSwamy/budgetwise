-- ============================================================================
-- SIMPLE RLS FIX - Copy all of this into Supabase SQL Editor
-- ============================================================================

-- Fix group_members policies
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;

CREATE POLICY "Users can view members of their groups" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND (g.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
      ))
    )
  );

CREATE POLICY "Users can add themselves when creating group" ON group_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id AND g.created_by = auth.uid()
    )
  );

CREATE POLICY "Group admins can add other members" ON group_members
  FOR INSERT WITH CHECK (
    user_id != auth.uid() AND EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND (g.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid() AND gm.role = 'admin'
      ))
    )
  );

CREATE POLICY "Group admins can remove members" ON group_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
      AND (g.created_by = auth.uid() OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = group_members.group_id
        AND gm.user_id = auth.uid() AND gm.role = 'admin'
      ))
    )
  );

-- Fix groups policies
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;

CREATE POLICY "Users can view groups they belong to" ON groups
  FOR SELECT USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id AND gm.user_id = auth.uid()
    )
  );

CREATE POLICY "Group admins can update groups" ON groups
  FOR UPDATE USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = groups.id
      AND gm.user_id = auth.uid() AND gm.role = 'admin'
    )
  );
