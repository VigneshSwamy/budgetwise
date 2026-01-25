-- BudgetWise MVP - Get Insights RPC
-- Migration: 010_get_insights.sql
-- Description: Returns top merchants, top categories, and budget impact breakdown

CREATE OR REPLACE FUNCTION public.get_insights(group_id UUID, period_key TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  top_merchants JSONB;
  top_categories JSONB;
  impact_breakdown JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM group_members gm
    WHERE gm.group_id = get_insights.group_id
      AND gm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT jsonb_agg(to_jsonb(m))
  INTO top_merchants
  FROM (
    SELECT
      COALESCE(merchant, 'Unknown') AS name,
      SUM(amount)::NUMERIC AS total
    FROM expenses
    WHERE expenses.group_id = get_insights.group_id
      AND expenses.period_key = get_insights.period_key
    GROUP BY merchant
    ORDER BY total DESC
    LIMIT 5
  ) m;

  SELECT jsonb_agg(to_jsonb(c))
  INTO top_categories
  FROM (
    SELECT
      COALESCE(category, 'Uncategorized') AS name,
      SUM(amount)::NUMERIC AS total
    FROM expenses
    WHERE expenses.group_id = get_insights.group_id
      AND expenses.period_key = get_insights.period_key
    GROUP BY category
    ORDER BY total DESC
    LIMIT 5
  ) c;

  SELECT jsonb_build_object(
    'budget_impact', COALESCE(SUM(amount) FILTER (WHERE budget_impact = true), 0),
    'split_only', COALESCE(SUM(amount) FILTER (WHERE budget_impact = false), 0)
  )
  INTO impact_breakdown
  FROM expenses
  WHERE expenses.group_id = get_insights.group_id
    AND expenses.period_key = get_insights.period_key;

  RETURN jsonb_build_object(
    'top_merchants', COALESCE(top_merchants, '[]'::jsonb),
    'top_categories', COALESCE(top_categories, '[]'::jsonb),
    'budget_impact_breakdown', COALESCE(impact_breakdown, '{}'::jsonb)
  );
END;
$$;
