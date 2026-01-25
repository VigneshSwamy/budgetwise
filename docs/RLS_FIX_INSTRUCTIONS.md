# Fix for RLS Infinite Recursion Error

## Problem
You're seeing the error: **"infinite recursion detected in policy for relation 'group_members'"**

This happens because the RLS policies for `group_members` were checking `group_members` itself, causing a circular dependency.

## Solution (Easy Steps)

### Step 1: Open Supabase SQL Editor

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New query"** button

### Step 2: Copy the Fix SQL

1. Open the file: `supabase/RLS_FIX_SIMPLE.sql`
2. **Copy ALL the SQL** (everything from `-- Fix RLS` to the last `);`)
3. **Paste it into the SQL Editor**

### Step 3: Run the SQL

1. Click the **"Run"** button (or press Cmd/Ctrl + Enter)
2. You should see: "Success. No rows returned"

### Step 4: Test

1. Go back to your app (http://localhost:3000)
2. Try creating a group again
3. The error should be gone! ✅

## What the Fix Does

- **Drops** the old problematic policies
- **Creates** new policies that check the `groups` table first (no recursion)
- **Allows** group creators to add themselves as admin members
- **Allows** admins to add/remove other members

## If You Still See Errors

Make sure you:
- ✅ Copied the ENTIRE SQL (all 5 steps)
- ✅ Didn't include the filename or file path
- ✅ Pasted into SQL Editor, not a query builder
- ✅ Clicked "Run" after pasting

### Option 2: Drop and Recreate Policies Manually

If the migration above doesn't work, you can manually fix it:

1. **Go to SQL Editor in Supabase Dashboard**

2. **Run these commands in order:**

```sql
-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view members of their groups" ON group_members;
DROP POLICY IF EXISTS "Group admins can add members" ON group_members;
DROP POLICY IF EXISTS "Group admins can remove members" ON group_members;
```

3. **Then run the new policies from `supabase/migrations/004_fix_rls_recursion.sql`**

## What Changed

The fix works by:

1. **For SELECT**: Checks `groups.created_by` first (no recursion), then falls back to `group_members` check (which is safe for SELECT)

2. **For INSERT**: Split into two separate policies:
   - **Policy 1**: Allows users to add themselves when they created the group (checks `groups.created_by`, no recursion)
   - **Policy 2**: Allows admins to add others (checks `groups.created_by` first, avoiding recursion for the common case)

3. **For DELETE**: Checks `groups.created_by` first to avoid recursion

## After Applying the Fix

1. ✅ Try creating a group again
2. ✅ The error should be resolved
3. ✅ You should be able to complete the signup → create group → set budget flow

## Troubleshooting

If you still see the error:

1. **Clear browser cache and cookies**
2. **Check if all policies were dropped**: Run `SELECT * FROM pg_policies WHERE tablename = 'group_members';` in SQL Editor
3. **Verify the new policies exist**: Should see 3 policies after applying the fix
4. **Check for typos**: Make sure policy names match exactly

Let me know if the fix works!
