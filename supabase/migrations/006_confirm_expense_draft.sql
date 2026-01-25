-- BudgetWise MVP - Confirm Expense Draft RPC
-- Migration: 006_confirm_expense_draft.sql
-- Description: Implements confirm_expense_draft with validation + normalization

DROP FUNCTION IF EXISTS public.confirm_expense_draft(UUID);

CREATE OR REPLACE FUNCTION public.confirm_expense_draft(draft_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  draft RECORD;
  paid_total NUMERIC;
  owed_total NUMERIC;
  expense_id UUID;
  wallet RECORD;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT *
  INTO draft
  FROM expense_drafts
  WHERE id = draft_id
    AND status = 'draft';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Draft not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM group_members gm
    WHERE gm.group_id = draft.group_id
      AND gm.user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF jsonb_typeof(draft.participants) <> 'array' THEN
    RAISE EXCEPTION 'Invalid participants format';
  END IF;

  SELECT
    COALESCE(SUM((p->>'paid_amount')::NUMERIC), 0),
    COALESCE(SUM((p->>'owed_amount')::NUMERIC), 0)
  INTO paid_total, owed_total
  FROM jsonb_array_elements(draft.participants) p;

  IF abs(paid_total - draft.amount) > 0.01
     OR abs(owed_total - draft.amount) > 0.01 THEN
    RAISE EXCEPTION 'Participants totals do not match expense amount';
  END IF;

  INSERT INTO expenses (
    draft_id,
    group_id,
    created_by,
    amount,
    merchant,
    date,
    period_key,
    budget_impact,
    category,
    category_source,
    source,
    notes,
    receipt_url,
    confirmed_at
  )
  VALUES (
    draft.id,
    draft.group_id,
    draft.created_by,
    draft.amount,
    draft.merchant,
    draft.date,
    draft.period_key,
    draft.budget_impact,
    draft.category,
    draft.category_source,
    draft.source,
    draft.notes,
    draft.receipt_url,
    NOW()
  )
  RETURNING id INTO expense_id;

  INSERT INTO expense_payments (expense_id, user_id, paid_amount)
  SELECT
    expense_id,
    (p->>'user_id')::UUID,
    (p->>'paid_amount')::NUMERIC
  FROM jsonb_array_elements(draft.participants) p;

  INSERT INTO expense_shares (expense_id, user_id, owed_amount)
  SELECT
    expense_id,
    (p->>'user_id')::UUID,
    (p->>'owed_amount')::NUMERIC
  FROM jsonb_array_elements(draft.participants) p;

  UPDATE expense_drafts
  SET status = 'confirmed',
      updated_at = NOW()
  WHERE id = draft.id;

  SELECT *
  INTO wallet
  FROM wallet_remaining
  WHERE group_id = draft.group_id
    AND period_key = draft.period_key;

  RETURN jsonb_build_object(
    'expense_id', expense_id,
    'wallet_remaining', jsonb_build_object(
      'group_id', wallet.group_id,
      'period_key', wallet.period_key,
      'budget_amount', wallet.budget_amount,
      'spent_amount', wallet.spent_amount,
      'remaining_amount', wallet.remaining_amount
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.confirm_expense_draft(UUID) TO authenticated;
