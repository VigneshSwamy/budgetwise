#!/usr/bin/env node

/**
 * Verification script for BudgetWise Phases 1, 2, 3
 * Checks project setup, dependencies, and code structure
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying BudgetWise Setup (Phases 1-3)\n');

let errors = [];
let warnings = [];
let checks = 0;

function check(name, condition, errorMsg, warnMsg = null) {
  checks++;
  if (condition) {
    console.log(`✅ ${name}`);
  } else {
    if (warnMsg) {
      console.log(`⚠️  ${name}: ${warnMsg}`);
      warnings.push(`${name}: ${warnMsg}`);
    } else {
      console.log(`❌ ${name}: ${errorMsg}`);
      errors.push(`${name}: ${errorMsg}`);
    }
  }
}

// Phase 1: Project Setup
console.log('📦 Phase 1: Project Setup & Infrastructure\n');

check(
  'package.json exists',
  fs.existsSync('package.json'),
  'package.json not found'
);

if (fs.existsSync('package.json')) {
  const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  check(
    'Next.js dependency',
    pkg.dependencies?.next !== undefined,
    'Next.js not in dependencies'
  );
  check(
    'Supabase dependency',
    pkg.dependencies?.['@supabase/supabase-js'] !== undefined,
    '@supabase/supabase-js not in dependencies'
  );
  check(
    'TypeScript in devDependencies',
    pkg.devDependencies?.typescript !== undefined,
    'TypeScript not in devDependencies'
  );
}

check('tsconfig.json exists', fs.existsSync('tsconfig.json'), 'tsconfig.json not found');
check('next.config.js exists', fs.existsSync('next.config.js'), 'next.config.js not found');
check('tailwind.config.ts exists', fs.existsSync('tailwind.config.ts'), 'tailwind.config.ts not found');

// Supabase setup
console.log('\n🔐 Supabase Configuration\n');

const envLocalExists = fs.existsSync('.env.local');
check('.env.local exists', envLocalExists, '.env.local not found - create it from env.example');

if (envLocalExists) {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const hasUrl = envContent.includes('NEXT_PUBLIC_SUPABASE_URL=') && 
                   !envContent.includes('NEXT_PUBLIC_SUPABASE_URL=your_');
    const hasKey = envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=') && 
                   !envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_');
    
    check(
      'Supabase URL configured',
      hasUrl,
      'NEXT_PUBLIC_SUPABASE_URL not set or still placeholder',
      hasUrl ? null : 'Update NEXT_PUBLIC_SUPABASE_URL with your actual Supabase URL'
    );
    
    check(
      'Supabase Anon Key configured',
      hasKey,
      'NEXT_PUBLIC_SUPABASE_ANON_KEY not set or still placeholder',
      hasKey ? null : 'Update NEXT_PUBLIC_SUPABASE_ANON_KEY with your actual key'
    );
  } catch (err) {
    warnings.push('Could not read .env.local');
  }
}

// Supabase client files
console.log('\n🔧 Supabase Client Setup\n');

check(
  'Browser client exists',
  fs.existsSync('lib/supabase/client.ts'),
  'lib/supabase/client.ts not found'
);
check(
  'Server client exists',
  fs.existsSync('lib/supabase/server.ts'),
  'lib/supabase/server.ts not found'
);
check(
  'Middleware exists',
  fs.existsSync('lib/supabase/middleware.ts'),
  'lib/supabase/middleware.ts not found'
);
check(
  'Next.js middleware exists',
  fs.existsSync('middleware.ts'),
  'middleware.ts not found'
);

// Database migrations
console.log('\n🗄️  Database Migrations\n');

check(
  'Migrations folder exists',
  fs.existsSync('supabase/migrations'),
  'supabase/migrations folder not found'
);

const migrations = [
  'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/002_rls_policies.sql',
  'supabase/migrations/003_rpc_functions.sql'
];

migrations.forEach(migration => {
  check(
    path.basename(migration),
    fs.existsSync(migration),
    `${migration} not found`
  );
});

// Phase 2: Authentication
console.log('\n🔑 Phase 2: Authentication & Onboarding\n');

check(
  'Login page exists',
  fs.existsSync('app/(auth)/login/page.tsx'),
  'app/(auth)/login/page.tsx not found'
);
check(
  'Signup page exists',
  fs.existsSync('app/(auth)/signup/page.tsx'),
  'app/(auth)/signup/page.tsx not found'
);
check(
  'Home/onboarding page exists',
  fs.existsSync('app/page.tsx'),
  'app/page.tsx not found'
);
check(
  'Dashboard page exists',
  fs.existsSync('app/(dashboard)/dashboard/page.tsx'),
  'app/(dashboard)/dashboard/page.tsx not found'
);

// Phase 3: Groups & Budgets
console.log('\n👥 Phase 3: Groups & Budgets\n');

check(
  'Create group page exists',
  fs.existsSync('app/(dashboard)/groups/create/page.tsx'),
  'app/(dashboard)/groups/create/page.tsx not found'
);
check(
  'Create group form component exists',
  fs.existsSync('components/groups/CreateGroupForm.tsx'),
  'components/groups/CreateGroupForm.tsx not found'
);
check(
  'Set budget page exists',
  fs.existsSync('app/(dashboard)/groups/[id]/budget/page.tsx'),
  'app/(dashboard)/groups/[id]/budget/page.tsx not found'
);
check(
  'Set budget form component exists',
  fs.existsSync('components/groups/SetBudgetForm.tsx'),
  'components/groups/SetBudgetForm.tsx not found'
);

// Structure checks
console.log('\n📁 Project Structure\n');

check(
  'App directory structure',
  fs.existsSync('app') && fs.existsSync('app/(auth)') && fs.existsSync('app/(dashboard)'),
  'App directory structure incomplete'
);
check(
  'Components directory exists',
  fs.existsSync('components'),
  'components directory not found'
);
check(
  'Types directory exists',
  fs.existsSync('types'),
  'types directory not found'
);

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Verification Summary\n');
console.log(`Total checks: ${checks}`);
console.log(`✅ Passed: ${checks - errors.length - warnings.length}`);
if (warnings.length > 0) {
  console.log(`⚠️  Warnings: ${warnings.length}`);
}
if (errors.length > 0) {
  console.log(`❌ Errors: ${errors.length}`);
}

if (errors.length > 0) {
  console.log('\n❌ Errors found:\n');
  errors.forEach(err => console.log(`  - ${err}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:\n');
  warnings.forEach(warn => console.log(`  - ${warn}`));
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✨ All checks passed! Phases 1-3 are properly set up.\n');
  console.log('Next steps:');
  console.log('  1. Ensure .env.local has actual Supabase credentials');
  console.log('  2. Apply database migrations in Supabase Dashboard');
  console.log('  3. Test the app: npm run dev');
  console.log('  4. Follow TESTING_CHECKLIST.md for full testing\n');
  process.exit(0);
} else if (errors.length === 0) {
  console.log('\n✅ Setup complete with warnings (see above).');
  console.log('Update .env.local with your Supabase credentials to proceed.\n');
  process.exit(0);
} else {
  console.log('\n❌ Setup incomplete. Please fix the errors above.\n');
  process.exit(1);
}