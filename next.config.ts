import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jkichlmfeyhnvlyuiqlv.supabase.co',
        pathname: '/storage/v1/object/public/logos/**',
      },
    ],
  },
}

export default nextConfig