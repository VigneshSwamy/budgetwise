-- ============================================================================
-- FIX GROUPS RLS WITHOUT RECURSION (FINAL)
-- Copy and paste this entire file into Supabase SQL Editor
-- ============================================================================

-- Drop existing group policies
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;
DROP POLICY IF EXISTS "Users can create groups" ON groups;

-- Drop helper functions if they exist
DROP FUNCTION IF EXISTS public.is_group_member(uuid, uuid);
DROP FUNCTION IF EXISTS public.is_group_admin(uuid, uuid);

-- Create helper functions that bypass RLS to avoid recursion
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_members
    WHERE group_id = _group_id
      AND user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM group_members
    WHERE group_id = _group_id
      AND user_id = _user_id
      AND role = 'admin'
  );
$$;

-- Recreate group policies using the helper functions
CREATE POLICY "Users can view groups they belong to" ON groups
  FOR SELECT USING (
    created_by = auth.uid()
    OR public.is_group_member(id, auth.uid())
  );

CREATE POLICY "Users can create groups" ON groups
  FOR INSERT WITH CHECK (
    created_by = auth.uid()
  );

CREATE POLICY "Group admins can update groups" ON groups
  FOR UPDATE USING (
    created_by = auth.uid()
    OR public.is_group_admin(id, auth.uid())
  );
