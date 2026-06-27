/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/signin',
        permanent: false,
      },
      {
        source: '/signin',
        destination: '/auth/signin',
        permanent: false,
      },
      {
        source: '/sign-in',
        destination: '/auth/signin',
        permanent: false,
      },
      {
        source: '/signup',
        destination: '/auth/register',
        permanent: false,
      },
      {
        source: '/sign-up',
        destination: '/auth/register',
        permanent: false,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig
