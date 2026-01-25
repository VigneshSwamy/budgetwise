# Testing Checklist - Phases 2-11

## Prerequisites

Before testing, ensure:

- [ ] `.env.local` file exists with valid Supabase credentials
- [ ] Database migrations have been applied (001 → 011)
- [ ] Development server is running (`npm run dev`)
- [ ] Server accessible at http://localhost:3000

---

## Phase 2: Authentication & Onboarding

### Test 1: Landing Page (Not Logged In)
**URL:** http://localhost:3000

**Expected:**
- [ ] Shows welcome screen with "BudgetWise" heading
- [ ] Displays "Control shared spending without stress" message
- [ ] Shows "Create your first group" button (links to /signup)
- [ ] Shows "Sign in" button (links to /login)
- [ ] Displays feature cards (Shared Budgets, Fair Splitting, etc.)
- [ ] No errors in browser console

### Test 2: Sign Up Flow
**URL:** http://localhost:3000/signup

**Steps:**
1. [ ] Page loads without errors
2. [ ] Form displays: Display Name (optional), Email, Password
3. [ ] Fill in form:
   - Display Name: "Test User" (optional)
   - Email: "test@example.com"
   - Password: "password123" (min 6 chars)
4. [ ] Click "Create account"
5. [ ] Should show loading state ("Creating account...")
6. [ ] On success:
   - [ ] Redirects to home page (/)
   - [ ] Home page should redirect to /groups/create (since no groups yet)
7. [ ] Check Supabase Dashboard:
   - [ ] User created in `auth.users`
   - [ ] Profile created in `profiles` table (via trigger)

**Error Cases:**
- [ ] Try duplicate email → Shows error message
- [ ] Try invalid email format → Browser validation error
- [ ] Try password < 6 chars → Browser validation error

### Test 3: Sign In Flow
**URL:** http://localhost:3000/login

**Steps:**
1. [ ] Page loads without errors
2. [ ] Form displays: Email, Password
3. [ ] Fill in form with created account:
   - Email: "test@example.com"
   - Password: "password123"
4. [ ] Click "Sign in"
5. [ ] Should show loading state ("Signing in...")
6. [ ] On success:
   - [ ] Redirects to /dashboard
   - [ ] Dashboard shows placeholder message

**Error Cases:**
- [ ] Wrong password → Shows error message
- [ ] Non-existent email → Shows error message
- [ ] Empty fields → Browser validation error

### Test 4: Redirect Logic (Logged In)
**URL:** http://localhost:3000 (while logged in)

**Expected:**
- [ ] If user has groups → Redirects to /dashboard
- [ ] If user has no groups → Redirects to /groups/create
- [ ] No infinite redirect loops
- [ ] Works correctly after creating first group

### Test 5: Protected Routes
**URLs:** /dashboard, /groups/create (while NOT logged in)

**Expected:**
- [ ] Redirects to /login
- [ ] Can access after logging in

---

## Phase 3: Groups & Budgets

### Test 6: Create Group Page
**URL:** http://localhost:3000/groups/create

**Prerequisites:** Must be logged in

**Steps:**
1. [ ] Page loads without errors
2. [ ] Shows "Create Your First Group" heading
3. [ ] Form displays:
   - [ ] Group Name input (required)
   - [ ] Group Type dropdown with options: Couple, Family, Roommates, Trip
4. [ ] Fill in form:
   - Group Name: "Home"
   - Group Type: "Couple"
5. [ ] Click "Continue"
6. [ ] Should show loading state ("Creating...")
7. [ ] On success:
   - [ ] Redirects to `/groups/{group_id}/budget`
   - [ ] Check Supabase Dashboard:
     - [ ] Group created in `groups` table
     - [ ] User added to `group_members` with role='admin'

**Error Cases:**
- [ ] Try with empty name → Browser validation error
- [ ] Check if error message displays on API failure

### Test 7: Set Budget Page
**URL:** http://localhost:3000/groups/{group_id}/budget

**Prerequisites:** Must be logged in AND member of the group

**Steps:**
1. [ ] Page loads without errors
2. [ ] Shows "Set Monthly Budget" heading
3. [ ] Shows helper text: "This is the amount you want to spend from BudgetWise this month..."
4. [ ] Form displays:
   - [ ] Budget amount input with $ prefix
   - [ ] Placeholder: "1000"
5. [ ] Fill in form:
   - Budget Amount: "1000"
6. [ ] Click "Start tracking"
7. [ ] Should show loading state ("Setting budget...")
8. [ ] On success:
   - [ ] Redirects to /dashboard
   - [ ] Check Supabase Dashboard:
     - [ ] Budget period created in `budget_periods` table
     - [ ] `period_key` is current month (e.g., "2026-01")
     - [ ] `budget_amount` is 1000.00

**Error Cases:**
- [ ] Try negative amount → Validation error
- [ ] Try zero → Validation error
- [ ] Try non-numeric → Browser validation error

### Test 8: Dashboard (After Setup)
**URL:** http://localhost:3000/dashboard

**Prerequisites:** Must be logged in

**Expected:**
- [ ] Page loads without errors
- [ ] Shows "Dashboard" heading
- [ ] Shows placeholder message: "Dashboard coming soon..."
- [ ] No console errors

---

## Phase 4: Core Expense Flow

### Test 9: Create Draft (Manual)
**URL:** http://localhost:3000/groups/{group_id}/expenses/new

**Steps:**
1. [ ] Page loads without errors
2. [ ] Fill amount, merchant, date, category
3. [ ] Split participants totals match amount
4. [ ] Click "Save draft"
5. [ ] Redirects to /expenses/drafts
6. [ ] Draft appears in list

### Test 10: Confirm Draft
**URL:** http://localhost:3000/groups/{group_id}/expenses/drafts

**Steps:**
1. [ ] Click "Confirm" on a draft
2. [ ] Draft disappears from drafts list
3. [ ] Confirmed expense appears in /expenses
4. [ ] `expense_payments` + `expense_shares` rows created

### Test 11: Expense Detail
**URL:** http://localhost:3000/groups/{group_id}/expenses/{expense_id}

**Expected:**
- [ ] Shows amount, category, budget impact
- [ ] Shows payments/shares breakdown

---

## Phase 5: Receipt Upload (MVP)

### Test 12: Upload Receipt (Draft)
**URL:** http://localhost:3000/groups/{group_id}/expenses/upload

**Steps:**
1. [ ] Upload image/PDF
2. [ ] Save draft
3. [ ] Confirm expense
4. [ ] Receipt appears in expense detail + list

---

## Phase 6: Voice Draft

### Test 13: Record + Transcribe
**URL:** http://localhost:3000/groups/{group_id}/expenses/voice

**Steps:**
1. [ ] Record audio and stop
2. [ ] Transcript appears
3. [ ] Auto-create draft toggled → draft saved

---

## Phase 7: Dashboard & Balances

### Test 14: Dashboard Summary
**URL:** http://localhost:3000/dashboard

**Expected:**
- [ ] Wallet remaining shows correct totals
- [ ] Recent transactions list populated
- [ ] Balances list populated

---

## Phase 8: Insights

### Test 15: Insights Page
**URL:** http://localhost:3000/groups/{group_id}/insights

**Expected:**
- [ ] Top merchants + categories show
- [ ] Budget impact vs split-only shows totals

---

## Phase 9: Statement Import (Stub)

### Test 16: Import Page
**URL:** http://localhost:3000/groups/{group_id}/imports

**Expected:**
- [ ] Shows placeholder text
- [ ] Links to manual + upload flows

---

## Phase 10: Notifications & Settings

### Test 17: Settings Page
**URL:** http://localhost:3000/settings

**Expected:**
- [ ] Toggles load saved values
- [ ] Save writes to `user_settings`

---

## Integration Tests

### Test 9: Complete User Journey
**Full flow test:**

1. [ ] Start at http://localhost:3000 (not logged in)
2. [ ] Click "Create your first group" → Goes to /signup
3. [ ] Sign up new account → Redirects to /groups/create
4. [ ] Create group "Home" → Redirects to /groups/{id}/budget
5. [ ] Set budget $1000 → Redirects to /dashboard
6. [ ] Log out (if logout button exists)
7. [ ] Log back in → Redirects to /dashboard (has groups)
8. [ ] Navigate to http://localhost:3000 → Redirects to /dashboard

### Test 10: Database Integrity
**Check in Supabase Dashboard:**

- [ ] User exists in `auth.users`
- [ ] Profile exists in `profiles` with matching `id`
- [ ] Group exists in `groups` with `created_by` = user.id
- [ ] Group member exists in `group_members`:
  - [ ] `group_id` matches created group
  - [ ] `user_id` matches user
  - [ ] `role` = 'admin'
- [ ] Budget period exists in `budget_periods`:
  - [ ] `group_id` matches created group
  - [ ] `period_key` is current month format (YYYY-MM)
  - [ ] `budget_amount` matches entered amount

---

## Common Issues & Fixes

### Issue: "Missing Supabase environment variables"
**Fix:** 
- Ensure `.env.local` exists in project root
- Verify variable names match exactly
- Restart dev server after creating/updating `.env.local`

### Issue: "relation does not exist" or table errors
**Fix:**
- Apply database migrations in Supabase Dashboard SQL Editor
- Run migrations in order: 001 → 002 → 003
- Verify tables exist in Supabase Dashboard > Table Editor

### Issue: "Unauthorized" or RLS policy errors
**Fix:**
- Verify RLS policies migration (002) was applied
- Check that user is logged in (auth.uid() available)
- Verify group membership exists

### Issue: Redirect loops
**Fix:**
- Clear browser cookies/session
- Check middleware.ts logic
- Verify redirect conditions are correct

### Issue: Profile not created on signup
**Fix:**
- Verify trigger exists: `on_auth_user_created`
- Check trigger function: `handle_new_user()`
- Ensure migration 001 was fully applied

---

## Browser Console Checks

Open DevTools (F12) and check:

- [ ] No React errors
- [ ] No Supabase connection errors
- [ ] No network errors (404s, 500s)
- [ ] No TypeScript errors (if using strict mode)

---

## Next Steps After Testing

Once all tests pass:

✅ **Phase 2 & 3 Complete**
- Ready to proceed to Phase 4 (Core Expense Flow)

❌ **If tests fail:**
- Document the failing test
- Check error messages in browser console
- Verify database migrations applied
- Check Supabase dashboard for data
