import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#f4f7f4',
          100: '#e3ebe3',
          200: '#c5d6c5',
          300: '#9eb89e',
          400: '#7a997a',
          500: '#8B9D83',
          600: '#1f6f5b',
          700: '#195a4a',
          800: '#334333',
          900: '#2a372a',
        },
        amber: {
          50: '#fbf8f3',
          100: '#f5efe4',
          200: '#ebdcc3',
          300: '#dec29b',
          400: '#D4A574',
          500: '#b88654',
          600: '#9c6b42',
          700: '#7d5336',
          800: '#66442f',
          900: '#543929',
        },
        terracotta: {
          50: '#fbf6f5',
          100: '#f5ebe9',
          200: '#ebd5d1',
          300: '#deb6b0',
          400: '#C89B8C',
          500: '#b07063',
          600: '#99564a',
          700: '#7f443b',
          800: '#6a3b34',
          900: '#58332e',
        },
      },
      boxShadow: {
        'soft-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'soft-md':
          '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
        'soft-lg':
          '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
}
export default config