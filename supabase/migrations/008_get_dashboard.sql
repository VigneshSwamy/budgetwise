-- BudgetWise MVP - Get Dashboard RPC
-- Migration: 008_get_dashboard.sql
-- Description: Returns wallet remaining + recent expenses + balances snapshot

CREATE OR REPLACE FUNCTION public.get_dashboard(group_id UUID, period_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  wallet RECORD;
  recent_expenses JSONB;
  balances JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM group_members gm
    WHERE gm.group_id = group_id
      AND gm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT *
  INTO wallet
  FROM wallet_remaining
  WHERE wallet_remaining.group_id = group_id
    AND wallet_remaining.period_key = period_key;

  SELECT jsonb_agg(to_jsonb(e) ORDER BY e.date DESC, e.created_at DESC)
  INTO recent_expenses
  FROM (
    SELECT id, amount, merchant, date, category, budget_impact, created_at
    FROM expenses
    WHERE expenses.group_id = group_id
      AND expenses.period_key = period_key
    ORDER BY date DESC, created_at DESC
    LIMIT 5
  ) e;

  SELECT jsonb_agg(to_jsonb(b))
  INTO balances
  FROM (
    SELECT * FROM public.get_balances(group_id, period_key)
  ) b;

  RETURN jsonb_build_object(
    'wallet_remaining', to_jsonb(wallet),
    'recent_expenses', COALESCE(recent_expenses, '[]'::jsonb),
    'balances', COALESCE(balances, '[]'::jsonb)
  );
END;
$$;
