-- ============================================================================
-- DROP ALL EXISTING POLICIES - Run this FIRST
-- ============================================================================
-- This will drop ALL policies on group_members and groups tables
-- Copy and paste this into Supabase SQL Editor and run it
-- ============================================================================

-- Drop ALL group_members policies (try all possible names)
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Users can add themselves when creating group" ON group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can add other members" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;

-- Drop ALL groups policies
DROP POLICY IF EXISTS "Users can view groups they belong to" ON groups;
DROP POLICY IF EXISTS "Group admins can update groups" ON groups;

-- If you still get errors, try this alternative method:
-- Get the actual policy names first by running CHECK_POLICIES.sql
-- Then manually drop each one you see in the results