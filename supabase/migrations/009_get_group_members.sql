-- BudgetWise MVP - Get Group Members RPC
-- Migration: 009_get_group_members.sql
-- Description: Returns group members with display names for UI

CREATE OR REPLACE FUNCTION public.get_group_members(group_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM group_members gm
    WHERE gm.group_id = get_group_members.group_id
      AND gm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  SELECT
    gm.user_id,
    COALESCE(pr.display_name, split_part(au.email, '@', 1)) AS display_name
  FROM group_members gm
  JOIN profiles pr ON pr.id = gm.user_id
  LEFT JOIN auth.users au ON au.id = gm.user_id
  WHERE gm.group_id = get_group_members.group_id
  ORDER BY pr.display_name NULLS LAST;
END;
$$;
