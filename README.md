<<<<<<< HEAD
# budgetwise
budgetwise app
=======
# BudgetWise

A shared budgeting and expense-splitting web app that lets groups control monthly spending with fixed budgets, while still allowing Splitwise-style tracking when expenses are added later.

## Tech Stack

- **Frontend**: Next.js (App Router) + TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp env.example .env.local
```

3. Add your Supabase credentials to `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
BudgetWise/
├── app/                    # Next.js App Router pages
├── components/             # React components
├── lib/
│   └── supabase/          # Supabase client configuration
├── types/                  # TypeScript type definitions
└── supabase/
    ├── migrations/         # Database migration files
    └── functions/          # Supabase Edge Functions
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
>>>>>>> c504b18 (Commit the running version of budgetwise)
