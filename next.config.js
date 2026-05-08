/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'avatars.githubusercontent.com',
      'via.placeholder.com',
      'theblacklist.online',
      'cdn.theblacklist.online',
    ],
  },
  // Enable CORS for domain
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  // Redirect www to non-www
  async redirects() {
    return [
      {
        source: '/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig