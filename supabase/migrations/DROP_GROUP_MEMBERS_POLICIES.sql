-- Drop all group_members policies dynamically
-- Run this first, then run FIX_GROUP_MEMBERS_ONLY.sql

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on group_members
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'group_members') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON group_members', r.policyname);
        RAISE NOTICE 'Dropped policy: % on group_members', r.policyname;
    END LOOP;
    
    RAISE NOTICE 'All group_members policies dropped successfully!';
END $$;