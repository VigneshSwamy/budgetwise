-- Check what policies currently exist
-- Run this FIRST to see what policies you have

-- Check group_members policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'group_members'
ORDER BY policyname;

-- Check groups policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'groups'
ORDER BY policyname;