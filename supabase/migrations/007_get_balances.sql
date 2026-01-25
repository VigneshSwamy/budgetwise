-- BudgetWise MVP - Get Balances RPC
-- Migration: 007_get_balances.sql
-- Description: Computes Splitwise-style net balances for a group + period

DROP FUNCTION IF EXISTS public.get_balances(UUID, TEXT);

CREATE OR REPLACE FUNCTION public.get_balances(group_id UUID, period_key TEXT)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  net_balance NUMERIC
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  WITH paid AS (
    SELECT
      ep.user_id,
      SUM(ep.paid_amount)::NUMERIC AS paid_total
    FROM expense_payments ep
    JOIN expenses e ON e.id = ep.expense_id
    WHERE e.group_id = $1
      AND e.period_key = $2
    GROUP BY ep.user_id
  ),
  owed AS (
    SELECT
      es.user_id,
      SUM(es.owed_amount)::NUMERIC AS owed_total
    FROM expense_shares es
    JOIN expenses e ON e.id = es.expense_id
    WHERE e.group_id = $1
      AND e.period_key = $2
    GROUP BY es.user_id
  )
  SELECT
    gm.user_id,
    pr.display_name,
    COALESCE(p.paid_total, 0) - COALESCE(o.owed_total, 0) AS net_balance
  FROM group_members gm
  JOIN profiles pr ON pr.id = gm.user_id
  LEFT JOIN paid p ON p.user_id = gm.user_id
  LEFT JOIN owed o ON o.user_id = gm.user_id
  WHERE gm.group_id = $1;
$$;
