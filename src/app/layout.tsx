import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { AntiCommerceWarning } from '@/components/AntiCommerceWarning'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'THEBLACKLIST.ONLINE - Cannabis Industry Transparency Network',
  description: 'A public accountability platform for the cannabis industry. Forums, reviews, transparency reports, and community-driven oversight.',
  keywords: 'cannabis, transparency, reviews, forums, industry watchdog, consumer protection',
  authors: [{ name: 'THEBLACKLIST.ONLINE Team' }],
  openGraph: {
    title: 'THEBLACKLIST.ONLINE',
    description: 'Cannabis Industry Transparency Network',
    url: 'https://theblacklist.online',
    siteName: 'THEBLACKLIST.ONLINE',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'THEBLACKLIST.ONLINE',
    description: 'Cannabis Industry Transparency Network',
    images: ['/og-image.jpg'],
  },
  // metadataBase used to resolve relative social image URLs during build
  metadataBase: process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || 'https://theblacklist.online',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <AntiCommerceWarning />
          {children}
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}