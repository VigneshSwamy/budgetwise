-- BudgetWise MVP - Merchant categorization rules
-- Migration: 015_merchant_rules.sql

CREATE TABLE IF NOT EXISTS merchant_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_text TEXT NOT NULL,
  category TEXT NOT NULL,
  is_regex BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS merchant_rules_unique_match
  ON merchant_rules(user_id, match_text);

ALTER TABLE merchant_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage merchant rules" ON merchant_rules;

CREATE POLICY "Users can manage merchant rules" ON merchant_rules
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
