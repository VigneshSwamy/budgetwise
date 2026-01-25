# BudgetWise Database Schema Documentation

## Overview

This document describes the database schema, Row Level Security (RLS) strategy, and RPC functions for BudgetWise MVP.

## Database Architecture

BudgetWise uses **Supabase PostgreSQL** with:
- **Row Level Security (RLS)** for data access control
- **Postgres RPC functions** for complex business logic
- **SQL views** for computed data (wallet remaining)
- **Triggers** for automatic profile creation and timestamp updates

## Migration Files

All database changes are managed through SQL migration files in `supabase/migrations/`:

1. **001_initial_schema.sql** - Tables, indexes, views, and triggers
2. **002_rls_policies.sql** - Row Level Security policies
3. **003_rpc_functions.sql** - RPC functions for business logic

## Tables

### Core Tables

#### `profiles`
User profile data (separate from `auth.users`).

**Columns:**
- `id` (UUID, PK) - References `auth.users(id)`
- `display_name` (TEXT) - User's display name
- `avatar_url` (TEXT) - Optional avatar URL
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Auto-creation:** Trigger creates profile when user signs up.

#### `groups`
Expense groups (couple, family, roommates, trip).

**Columns:**
- `id` (UUID, PK)
- `name` (TEXT, NOT NULL)
- `type` (TEXT, NOT NULL) - CHECK: 'couple', 'family', 'roommates', 'trip'
- `currency` (TEXT, DEFAULT 'USD')
- `created_by` (UUID) - References `profiles(id)`
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `group_members`
Many-to-many relationship between users and groups.

**Columns:**
- `id` (UUID, PK)
- `group_id` (UUID, FK → `groups.id`)
- `user_id` (UUID, FK → `profiles.id`)
- `role` (TEXT, DEFAULT 'member') - CHECK: 'admin', 'member'
- `joined_at` (TIMESTAMPTZ)
- **UNIQUE:** `(group_id, user_id)`

#### `budget_periods`
Monthly budget per group.

**Columns:**
- `id` (UUID, PK)
- `group_id` (UUID, FK → `groups.id`)
- `period_key` (TEXT, NOT NULL) - Format: 'YYYY-MM' (e.g., '2026-01')
- `budget_amount` (DECIMAL(12,2), NOT NULL, CHECK >= 0)
- `start_date`, `end_date` (DATE, NOT NULL)
- `created_at` (TIMESTAMPTZ)
- **UNIQUE:** `(group_id, period_key)`

### Expense Tables

#### `expense_drafts`
Draft expenses before confirmation (stores participants as JSONB).

**Columns:**
- `id` (UUID, PK)
- `group_id` (UUID, FK → `groups.id`)
- `created_by` (UUID, FK → `profiles.id`)
- `amount` (DECIMAL(12,2), NOT NULL, CHECK > 0)
- `merchant` (TEXT)
- `date` (DATE, NOT NULL)
- `period_key` (TEXT, NOT NULL) - Derived from date or explicit override
- `budget_impact` (BOOLEAN, NOT NULL, DEFAULT false) - **Core differentiator**
- `category` (TEXT, nullable)
- `category_source` (TEXT, DEFAULT 'user') - CHECK: 'user', 'ocr', 'rule'
- `participants` (JSONB, NOT NULL) - See JSON structure below
- `source` (TEXT, DEFAULT 'manual') - CHECK: 'manual', 'scan', 'voice', 'import'
- `status` (TEXT, DEFAULT 'draft') - CHECK: 'draft', 'confirmed', 'cancelled'
- `notes` (TEXT)
- `receipt_url` (TEXT) - Reference to Supabase Storage
- `created_at`, `updated_at` (TIMESTAMPTZ)

**Draft JSON Structure:**
```json
{
  "participants": [
    {"user_id": "uuid", "paid_amount": 100.00, "owed_amount": 50.00},
    {"user_id": "uuid", "paid_amount": 0.00, "owed_amount": 50.00}
  ]
}
```

#### `expenses`
Final confirmed expenses (normalized).

**Columns:**
- `id` (UUID, PK)
- `draft_id` (UUID, FK → `expense_drafts.id`, nullable)
- `group_id` (UUID, FK → `groups.id`)
- `created_by` (UUID, FK → `profiles.id`)
- `amount` (DECIMAL(12,2), NOT NULL, CHECK > 0)
- `merchant` (TEXT)
- `date` (DATE, NOT NULL)
- `period_key` (TEXT, NOT NULL) - **CRITICAL: every expense must have period_key**
- `budget_impact` (BOOLEAN, NOT NULL)
- `category` (TEXT)
- `category_source` (TEXT, DEFAULT 'user')
- `source` (TEXT, DEFAULT 'manual')
- `notes` (TEXT)
- `receipt_url` (TEXT)
- `confirmed_at` (TIMESTAMPTZ, DEFAULT NOW())
- `created_at`, `updated_at` (TIMESTAMPTZ)

#### `expense_payments`
Who paid what (normalized from draft JSON).

**Columns:**
- `id` (UUID, PK)
- `expense_id` (UUID, FK → `expenses.id`)
- `user_id` (UUID, FK → `profiles.id`)
- `paid_amount` (DECIMAL(12,2), NOT NULL, CHECK >= 0)
- `created_at` (TIMESTAMPTZ)
- **UNIQUE:** `(expense_id, user_id)`

**Invariant:** `SUM(paid_amount WHERE expense_id = X) = expenses.amount WHERE id = X`

#### `expense_shares`
Who owes what (normalized from draft JSON).

**Columns:**
- `id` (UUID, PK)
- `expense_id` (UUID, FK → `expenses.id`)
- `user_id` (UUID, FK → `profiles.id`)
- `owed_amount` (DECIMAL(12,2), NOT NULL, CHECK >= 0)
- `created_at` (TIMESTAMPTZ)
- **UNIQUE:** `(expense_id, user_id)`

**Invariant:** `SUM(owed_amount WHERE expense_id = X) = expenses.amount WHERE id = X`

### Supporting Tables

#### `uploads`
File uploads (receipts, statements).

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → `profiles.id`)
- `group_id` (UUID, FK → `groups.id`, nullable)
- `file_url` (TEXT, NOT NULL) - Supabase Storage path
- `mime_type` (TEXT)
- `file_name` (TEXT)
- `file_size` (BIGINT)
- `status` (TEXT, DEFAULT 'pending') - CHECK: 'pending', 'processed', 'failed'
- `created_at` (TIMESTAMPTZ)

#### `user_settings`
User notification preferences.

**Columns:**
- `id` (UUID, PK)
- `user_id` (UUID, FK → `profiles.id`, UNIQUE)
- `weekly_summary` (BOOLEAN, DEFAULT false)
- `budget_alert_threshold` (INTEGER, DEFAULT 20) - Percentage
- `budget_alert_enabled` (BOOLEAN, DEFAULT true)
- `settlement_reminder_enabled` (BOOLEAN, DEFAULT true)
- `created_at`, `updated_at` (TIMESTAMPTZ)

## Indexes

Indexes are created for performance on frequently queried columns:

- **Groups:** `group_id`, `user_id` on `group_members`
- **Budgets:** `(group_id, period_key)` on `budget_periods`
- **Expenses:** `(group_id, period_key)`, `date`, `(period_key, budget_impact)` on `expenses`
- **Payments/Shares:** `expense_id`, `user_id` on both tables
- **Drafts:** `(group_id, status)`, `created_by` on `expense_drafts`
- **Uploads:** `user_id`, `group_id` on `uploads`

## Views

### `wallet_remaining`
Calculates wallet remaining per group + period.

**Columns:**
- `group_id` (UUID)
- `period_key` (TEXT)
- `budget_amount` (DECIMAL(12,2))
- `spent_amount` (DECIMAL(12,2)) - SUM of expenses with `budget_impact = true`
- `remaining_amount` (DECIMAL(12,2)) - `budget_amount - spent_amount`

**Usage:**
```sql
SELECT * FROM wallet_remaining 
WHERE group_id = '...' AND period_key = '2026-01';
```

## Row Level Security (RLS) Strategy

### Principles

1. **Group-scoped access:** Users can only access data for groups they belong to
2. **User-scoped access:** Users can only access their own profile and settings
3. **Read-only for payments/shares:** Users can view but not directly modify (RPC only)
4. **Admin-only operations:** Only group admins can modify group settings and members

### RLS Policies by Table

#### `profiles`
- **SELECT:** Users can view their own profile
- **UPDATE:** Users can update their own profile

#### `groups`
- **SELECT:** Users can view groups they belong to
- **INSERT:** Users can create groups (becomes admin)
- **UPDATE:** Only group admins can update groups

#### `group_members`
- **SELECT:** Users can view members of their groups
- **INSERT:** Only group admins can add members
- **DELETE:** Only group admins can remove members

#### `budget_periods`
- **ALL:** Users can manage budgets for groups they belong to

#### `expense_drafts`
- **ALL:** Users can manage drafts for groups they belong to

#### `expenses`
- **ALL:** Users can manage expenses for groups they belong to

#### `expense_payments` & `expense_shares`
- **SELECT:** Users can view payments/shares for expenses in their groups
- **INSERT/UPDATE/DELETE:** Only via RPC functions (service role key)

#### `uploads`
- **SELECT:** Users can view their own uploads and group uploads
- **INSERT:** Users can create uploads
- **DELETE:** Users can delete their own uploads

#### `user_settings`
- **ALL:** Users can manage their own settings

## RPC Functions

### `confirm_expense_draft(draft_id UUID)`

Converts draft to final expense with normalized payments/shares.

**Input:**
- `draft_id` (UUID)

**Output:** JSONB
```json
{
  "expense_id": "uuid",
  "wallet_remaining_before": 1000.00,
  "wallet_remaining_after": 900.00,
  "balances_delta": [
    {
      "user_id": "uuid",
      "balance_before": 0,
      "balance_after": 50,
      "delta": 50
    }
  ]
}
```

**Logic:**
1. Validates draft exists and is in 'draft' status
2. Validates participants JSON invariants
3. Calculates wallet remaining BEFORE
4. Inserts into `expenses` table
5. Normalizes participants JSON → inserts into `expense_payments` and `expense_shares`
6. Calculates wallet remaining AFTER
7. Calculates balances delta per user
8. Updates draft status to 'confirmed'
9. Returns result

**Security:** `SECURITY DEFINER` - Uses service role permissions

### `preview_expense_edit(expense_id UUID, patch_json JSONB)`

Previews impact of editing an expense without writing.

**Input:**
- `expense_id` (UUID)
- `patch_json` (JSONB) - e.g., `{"amount": 150, "date": "2026-01-15", "budget_impact": true}`

**Output:** JSONB
```json
{
  "wallet_remaining_before": 1000.00,
  "wallet_remaining_after": 850.00,
  "balances_before": [...],
  "balances_after": [...],
  "requires_confirmation": true
}
```

**Security:** `SECURITY DEFINER`

### `get_dashboard(group_id UUID, period_key TEXT)`

Aggregated dashboard data (single call).

**Input:**
- `group_id` (UUID)
- `period_key` (TEXT) - e.g., '2026-01'

**Output:** JSONB with wallet, recent expenses, and balance snapshot

**Security:** `SECURITY DEFINER` (RLS ensures user is group member)

### `get_balances(group_id UUID, period_key TEXT)`

Splitwise-style net balances.

**Input:**
- `group_id` (UUID)
- `period_key` (TEXT)

**Output:** JSONB with balances per user and summary

**Security:** `SECURITY DEFINER`

### `get_insights(group_id UUID, period_key TEXT)`

Insights aggregation (top merchants, categories, fixed vs variable).

**Input:**
- `group_id` (UUID)
- `period_key` (TEXT)

**Output:** JSONB with insights data

**Security:** `SECURITY DEFINER`

## Triggers

### Auto-create Profile
**Trigger:** `on_auth_user_created`
**Function:** `handle_new_user()`
**Purpose:** Automatically creates a profile when a user signs up

### Auto-update Timestamps
**Triggers:** `update_*_updated_at` on tables with `updated_at` column
**Function:** `handle_updated_at()`
**Purpose:** Automatically updates `updated_at` timestamp on row updates

## Data Flow

### Expense Creation Flow

1. **Create Draft:** User creates `expense_drafts` record with JSONB participants
2. **Preview:** Frontend can preview impact (optional)
3. **Confirm:** Call `confirm_expense_draft(draft_id)` RPC
4. **Normalize:** RPC creates `expenses` record and normalizes into `expense_payments` and `expense_shares`
5. **Update Wallet:** Wallet remaining is recalculated via view

### Period Key Rules

- Every expense **must** have a `period_key`
- Default: Derived from expense `date` (YYYY-MM format)
- Override: Can be explicitly set (with preview/confirmation)
- Editing: Changing `period_key` requires confirmation

## Security Considerations

1. **RLS is enabled on all tables** - No data access without proper policies
2. **RPC functions use SECURITY DEFINER** - Can bypass RLS for controlled operations
3. **Service role key** - Required for RPC functions that modify `expense_payments` and `expense_shares`
4. **Group membership checks** - All policies verify user is group member
5. **Admin-only operations** - Group modifications require admin role

## Migration Instructions

1. **Apply migrations in order:**
   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or manually in Supabase Dashboard SQL Editor
   # Run 001_initial_schema.sql
   # Run 002_rls_policies.sql
   # Run 003_rpc_functions.sql
   ```

2. **Verify RLS is enabled:**
   ```sql
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public';
   ```

3. **Test RPC functions:**
   ```sql
   SELECT confirm_expense_draft('draft-uuid-here');
   ```

## Notes

- **Draft JSON vs Normalized:** Drafts store flexible JSON, final expenses are normalized for reliable queries
- **Invariants:** Payment and share totals must equal expense amount (enforced in RPC)
- **Period Key:** Critical for wallet calculations - always required on expenses
- **Budget Impact:** Per-expense decision (not global) - core differentiator