# Step-by-Step Guide to Fix RLS Policies

## Problem
You're getting errors when trying to drop policies because they already exist or have different names.

## Solution - Follow These Steps

### Step 1: Check What Policies Exist

1. Open Supabase Dashboard → SQL Editor
2. Open the file: `supabase/migrations/CHECK_POLICIES.sql`
3. Copy and paste it into SQL Editor
4. Click **Run**
5. **Note down the exact policy names** you see in the results

### Step 2: Drop All Existing Policies

You have two options:

#### Option A: Use Dynamic Drop (Easiest)
1. Open: `supabase/migrations/DROP_ALL_POLICIES_DYNAMIC.sql`
2. Copy and paste into SQL Editor
3. Click **Run**
4. This will automatically find and drop ALL policies

#### Option B: Manual Drop
1. Open: `supabase/migrations/DROP_ALL_POLICIES.sql`
2. Copy and paste into SQL Editor
3. Click **Run**
4. If you still see errors, look at the policy names from Step 1 and manually drop each one:
   ```sql
   DROP POLICY "exact-policy-name-from-step1" ON table_name;
   ```

### Step 3: Verify Policies Are Dropped

Run `supabase/migrations/CHECK_POLICIES.sql` again - you should see **no results** (empty).

### Step 4: Create New Fixed Policies

1. Open: `supabase/RLS_FIX_SAFE.sql`
2. Copy and paste into SQL Editor
3. Click **Run**
4. Should see: "Success. No rows returned"

### Step 5: Verify New Policies

Run `supabase/migrations/CHECK_POLICIES.sql` again - you should see:
- **3 policies** on `group_members`:
  - Users can view members of their groups
  - Users can add themselves when creating group
  - Group admins can add other members
  - Group admins can remove members
- **2 policies** on `groups`:
  - Users can view groups they belong to
  - Group admins can update groups

## Troubleshooting

### If Dynamic Drop Doesn't Work

Try this manual approach:

```sql
-- Get all policy names
SELECT policyname FROM pg_policies WHERE tablename = 'group_members';
SELECT policyname FROM pg_policies WHERE tablename = 'groups';

-- Then drop each one manually:
DROP POLICY "policy-name-here" ON group_members;
DROP POLICY "policy-name-here" ON groups;
```

### If You Get Permission Errors

Make sure you're running as the database owner or have superuser privileges. If not, contact your Supabase project admin.

### Alternative: Disable RLS Temporarily

If you're stuck, you can temporarily disable RLS to clean up:

```sql
-- WARNING: This disables security temporarily!
ALTER TABLE group_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE groups DISABLE ROW LEVEL SECURITY;

-- Drop policies
-- (run DROP_ALL_POLICIES_DYNAMIC.sql)

-- Re-enable RLS
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- Then create new policies
-- (run RLS_FIX_SAFE.sql)
```

## Quick Command Reference

```sql
-- Check policies
SELECT policyname FROM pg_policies WHERE tablename = 'group_members';
SELECT policyname FROM pg_policies WHERE tablename = 'groups';

-- Drop specific policy
DROP POLICY "policy-name" ON table_name;

-- Drop all policies dynamically
-- (use DROP_ALL_POLICIES_DYNAMIC.sql)
```
