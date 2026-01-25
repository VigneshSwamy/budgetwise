# Quick Fix: Missing Supabase Environment Variables

## Problem
Error: `Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local`

## Solution

### Option 1: Create .env.local Manually (Recommended)

1. **Create the file in your project root:**
   ```bash
   touch .env.local
   ```

2. **Open `.env.local` in your editor** and add:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
   ```

3. **Get your Supabase credentials:**
   - Go to: https://supabase.com/dashboard
   - Select your project (or create one)
   - Go to: **Settings** → **API**
   - Copy the values:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

4. **Replace placeholders** in `.env.local` with your actual values

5. **Restart the dev server:**
   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

### Option 2: Copy from Example (If file was created)

If the `.env.local` file was created with placeholder values:

```bash
# Edit the file
code .env.local
# or
nano .env.local
# or use any text editor
```

Then replace the placeholder values with your actual Supabase credentials.

### Option 3: Use Terminal Command

```bash
# Copy example file
cp env.example .env.local

# Then edit .env.local with your actual values
# On Mac:
open -e .env.local
# On Linux:
nano .env.local
# On Windows:
notepad .env.local
```

## Verify Setup

After creating `.env.local`, verify:

1. **File exists:**
   ```bash
   ls -la .env.local
   ```

2. **Check contents (without exposing secrets):**
   ```bash
   grep -E "NEXT_PUBLIC_SUPABASE" .env.local
   ```

3. **Restart dev server** - The error should be gone

## Still Having Issues?

- ✅ Ensure `.env.local` is in project root (same level as `package.json`)
- ✅ Check for typos in variable names (must be exact)
- ✅ Restart dev server after creating/editing `.env.local`
- ✅ Check that Supabase project is active and accessible

## Next Steps

Once `.env.local` is set up:
1. Apply database migrations (see `supabase/README.md`)
2. Test the app at http://localhost:3000
3. Follow `docs/TESTING_CHECKLIST.md` for full testing
