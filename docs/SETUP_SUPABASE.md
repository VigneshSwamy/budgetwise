# Setting Up Supabase for BudgetWise

## Quick Setup Guide

### Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in:
   - **Name:** BudgetWise (or any name)
   - **Database Password:** Choose a strong password (save this!)
   - **Region:** Choose closest to you
5. Click "Create new project"
6. Wait 2-3 minutes for project to initialize

### Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** (gear icon in sidebar)
2. Click **API** in the settings menu
3. You'll see:

   ```
   Project URL: https://xxxxxxxxxxxxx.supabase.co
   anon public: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   service_role: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Step 3: Update .env.local

1. Open `.env.local` in your project root
2. Replace the placeholder values:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Important:** 
   - The `SUPABASE_SERVICE_ROLE_KEY` is sensitive - never commit it to git
   - The `.env.local` file is already in `.gitignore`

### Step 4: Apply Database Migrations

After setting up the project, you need to run the database migrations:

1. **Option A: Using Supabase Dashboard (Easiest)**
   - Go to your Supabase project
   - Click **SQL Editor** in the sidebar
   - Run each migration file in order:
     - Copy/paste contents of `supabase/migrations/001_initial_schema.sql`
     - Click "Run"
     - Repeat for `002_rls_policies.sql`
     - Repeat for `003_rpc_functions.sql`

2. **Option B: Using Supabase CLI**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login
   supabase login
   
   # Link to your project
   supabase link --project-ref your-project-ref
   
   # Push migrations
   supabase db push
   ```

### Step 5: Restart Development Server

After updating `.env.local`:

1. Stop the dev server (Ctrl+C)
2. Restart it:
   ```bash
   npm run dev
   ```

### Step 6: Verify Setup

1. Open http://localhost:3000
2. Should no longer see Supabase error
3. Check browser console - no Supabase connection errors

## Troubleshooting

### Error: "Missing Supabase environment variables"

- ✅ Check `.env.local` exists in project root
- ✅ Verify variable names are exactly:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- ✅ Restart dev server after changing `.env.local`

### Error: "Invalid API key"

- ✅ Check you copied the full key (it's very long)
- ✅ Verify no extra spaces or quotes
- ✅ Make sure you're using the `anon public` key for `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Error: "Project URL not found"

- ✅ Verify the URL format: `https://xxxxxxxxxxxxx.supabase.co`
- ✅ Check the URL in Supabase Dashboard > Settings > API

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Dashboard: https://supabase.com/dashboard
- API Settings: https://supabase.com/dashboard/project/_/settings/api
