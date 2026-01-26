import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'BudgetWise',
    short_name: 'BudgetWise',
    description: 'Control shared spending without stress.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FBF8F3',
    theme_color: '#FBF8F3',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
