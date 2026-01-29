import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.vigneshswamy.budgetwiseapp',
  appName: 'BudgetWise',
  webDir: 'public',
  server: {
    url: 'https://budgetwise-kohl.vercel.app/',
    cleartext: false,
  },
}

export default config
