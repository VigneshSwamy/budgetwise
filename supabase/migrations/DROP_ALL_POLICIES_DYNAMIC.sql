-- ============================================================================
-- DYNAMIC DROP - Drops ALL policies automatically
-- ============================================================================
-- This script will automatically find and drop all policies
-- Run this if the manual drop isn't working
-- ============================================================================

-- Function to drop all policies on a table
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on group_members
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'group_members') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON group_members', r.policyname);
        RAISE NOTICE 'Dropped policy: % on group_members', r.policyname;
    END LOOP;
    
    -- Drop all policies on groups
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'groups') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON groups', r.policyname);
        RAISE NOTICE 'Dropped policy: % on groups', r.policyname;
    END LOOP;
    
    RAISE NOTICE 'All policies dropped successfully!';
END $$;