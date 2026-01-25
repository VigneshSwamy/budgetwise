-- BudgetWise MVP - Storage RLS for receipts
-- Migration: 011_storage_policies.sql
-- Description: Allow authenticated users to upload/read/delete receipts

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Receipts insert own objects" ON storage.objects;
DROP POLICY IF EXISTS "Receipts select own objects" ON storage.objects;
DROP POLICY IF EXISTS "Receipts delete own objects" ON storage.objects;

-- Allow authenticated users to upload receipts to the receipts bucket
CREATE POLICY "Receipts insert own objects" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipts'
    AND owner = auth.uid()
  );

-- Allow authenticated users to read their own receipts
CREATE POLICY "Receipts select own objects" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND owner = auth.uid()
  );

-- Allow authenticated users to delete their own receipts
CREATE POLICY "Receipts delete own objects" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'receipts'
    AND owner = auth.uid()
  );
