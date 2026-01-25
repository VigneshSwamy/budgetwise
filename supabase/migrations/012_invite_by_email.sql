-- BudgetWise MVP - Invite member by email RPC
-- Migration: 012_invite_by_email.sql
-- Description: Adds a user to a group using their auth email

DROP FUNCTION IF EXISTS public.invite_member_by_email(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.invite_member_by_email(p_group_id UUID, p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  target_user_id UUID;
  is_admin BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM group_members gm
  WHERE gm.group_id = p_group_id
      AND gm.user_id = auth.uid()
      AND gm.role = 'admin'
  ) INTO is_admin;

  IF NOT is_admin THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT id
  INTO target_user_id
  FROM auth.users
  WHERE auth.users.email = p_email
  LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (p_group_id, target_user_id, 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN jsonb_build_object(
    'invited_user_id', target_user_id,
    'status', 'ok'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.invite_member_by_email(UUID, TEXT) TO authenticated;
