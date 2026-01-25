-- BudgetWise MVP - Allow group deletion by owner/admin
-- Migration: 013_groups_delete_policy.sql

-- Helper functions to avoid RLS recursion
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

DROP POLICY IF EXISTS "Group admins can delete groups" ON groups;

CREATE POLICY "Group admins can delete groups" ON groups
  FOR DELETE USING (
    created_by = auth.uid()
    OR public.is_group_admin(id, auth.uid())
  );
