-- BudgetWise MVP - Storage RLS for profile avatars
-- Migration: 014_avatars_storage_policies.sql
-- Description: Allow authenticated users to upload/read/delete their own avatars

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Avatars insert own objects" ON storage.objects;
DROP POLICY IF EXISTS "Avatars select own objects" ON storage.objects;
DROP POLICY IF EXISTS "Avatars delete own objects" ON storage.objects;

CREATE POLICY "Avatars insert own objects" ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND owner = auth.uid()
  );

CREATE POLICY "Avatars select own objects" ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND owner = auth.uid()
  );

CREATE POLICY "Avatars delete own objects" ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND owner = auth.uid()
  );
