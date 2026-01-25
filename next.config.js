/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: (() => {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      if (!url) return []
      try {
        const { hostname } = new URL(url)
        return [
          {
            protocol: 'https',
            hostname,
          },
        ]
      } catch (err) {
        return []
      }
    })(),
  },
}

module.exports = nextConfig