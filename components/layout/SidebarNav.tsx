'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { href: '/transactions', label: 'Transactions', icon: TransactionsIcon },
  { href: '/budgets', label: 'Budgets', icon: BudgetsIcon },
  { href: '/categories', label: 'Categories', icon: CategoriesIcon },
  { href: '/reports', label: 'Reports', icon: ReportsIcon },
  { href: '/accounts', label: 'Accounts', icon: AccountsIcon },
  { href: '/goals', label: 'Goals', icon: GoalsIcon },
  { href: '/calendar', label: 'Calendar', icon: CalendarIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function SidebarNav() {
  const pathname = usePathname()

  return (
    <nav className="flex-1 space-y-2">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        const Icon = item.icon
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? 'bg-white text-slate-900 shadow-soft-sm'
                : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                isActive ? 'bg-[#e6f4f0] text-[#1f6f5b]' : 'bg-slate-100 text-slate-400'
              }`}
            >
              <Icon />
            </span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="1.5" strokeWidth="1.8" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" strokeWidth="1.8" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" strokeWidth="1.8" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" strokeWidth="1.8" />
    </svg>
  )
}

function TransactionsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <rect x="4" y="3" width="16" height="18" rx="2" strokeWidth="1.8" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function BudgetsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path
        d="M12 3v18M5 7h14M5 17h14"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
    </svg>
  )
}

function CategoriesIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path d="M3 7h8v8H3z" strokeWidth="1.8" />
      <path d="M15 3h6v6h-6z" strokeWidth="1.8" />
      <path d="M15 13h6v8h-6z" strokeWidth="1.8" />
    </svg>
  )
}

function ReportsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path d="M4 19V5" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 19v-6" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 19v-9" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M16 19v-4" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 19V7" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function AccountsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <rect x="3" y="6" width="18" height="12" rx="2" strokeWidth="1.8" />
      <path d="M3 10h18" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function GoalsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <path
        d="M6 4h12l-1 6a5 5 0 0 1-4.9 4H11a5 5 0 0 1-4.9-4L6 4z"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M12 14v6M9 20h6" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <rect x="3" y="5" width="18" height="16" rx="2" strokeWidth="1.8" />
      <path d="M3 9h18" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M8 3v4M16 3v4" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor">
      <circle cx="12" cy="12" r="3" strokeWidth="1.8" />
      <path
        d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.5-2.4 1a7 7 0 0 0-1.8-1l-.4-2.6h-4l-.4 2.6a7 7 0 0 0-1.8 1l-2.4-1-2 3.5 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.5 2.4-1a7 7 0 0 0 1.8 1l.4 2.6h4l.4-2.6a7 7 0 0 0 1.8-1l2.4 1 2-3.5-2-1.5c.1-.3.1-.7.1-1z"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
