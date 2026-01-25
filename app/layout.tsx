import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import './globals.css'

const dmSans = DM_Sans({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'BudgetWise - Control shared spending without stress',
  description: 'A shared budgeting and expense-splitting web app that lets groups control monthly spending with fixed budgets.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.className} bg-[#FBF8F3] text-[#4A4A4A] antialiased`}>
        {children}
      </body>
    </html>
  )
}