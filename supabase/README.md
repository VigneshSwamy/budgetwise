# Supabase Database Migrations

This folder contains SQL migration files for the BudgetWise database schema.

## Migration Files

### 001_initial_schema.sql
Creates all tables, indexes, views, and triggers:
- Core tables: `profiles`, `groups`, `group_members`, `budget_periods`
- Expense tables: `expense_drafts`, `expenses`, `expense_payments`, `expense_shares`
- Supporting tables: `uploads`, `user_settings`
- Indexes for performance
- Views: `wallet_remaining`
- Triggers: Auto-create profile, auto-update timestamps

### 002_rls_policies.sql
Enables Row Level Security (RLS) and creates security policies:
- RLS enabled on all tables
- Group-scoped access policies
- User-scoped access policies
- Admin-only operation policies

### 003_rpc_functions.sql
Creates Postgres RPC functions for business logic:
- `confirm_expense_draft()` - Convert draft to expense
- `preview_expense_edit()` - Preview edit impact
- `get_dashboard()` - Aggregated dashboard data
- `get_balances()` - Splitwise-style balances
- `get_insights()` - Insights aggregation

## Applying Migrations

### Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_rpc_functions.sql`

## Migration Order

**Important:** Migrations must be applied in order:
1. Schema first (tables, indexes, views)
2. RLS policies second (requires tables to exist)
3. RPC functions last (may reference tables and views)

## Verifying Migrations

After applying migrations, verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check RPC functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION';
```

## Development Workflow

1. **Create new migration:**
   ```bash
   # Create new migration file
   touch supabase/migrations/004_new_feature.sql
   ```

2. **Test locally:**
   ```bash
   # Start local Supabase
   supabase start
   
   # Apply migrations
   supabase db reset
   ```

3. **Apply to production:**
   ```bash
   # Push to production
   supabase db push
   ```

## Documentation

See `docs/DB_SCHEMA.md` for detailed schema documentation.