import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

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
          {children}
        </Providers>
      </body>
    </html>
  )
}