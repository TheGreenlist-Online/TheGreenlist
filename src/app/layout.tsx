import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ClerkProvider } from '@clerk/nextjs'
import { QueryProvider } from '@/lib/query-provider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'THEBLACKLIST - Premium Cannabis Community & Reviews',
  description: 'Discover, review, and discuss cannabis strains and products with real consumers. Join our community for product recommendations, forum discussions, and dispensary reviews.',
  keywords: 'cannabis, strains, reviews, dispensaries, forum, community, cannabis reviews, strain database',
  metadataBase: new URL('https://theblacklist.online'),
  alternates: {
    canonical: 'https://theblacklist.online',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://theblacklist.online',
    siteName: 'THEBLACKLIST',
    title: 'THEBLACKLIST - Cannabis Community & Reviews',
    description: 'Premium cannabis community platform for reviews, discussions, and dispensary discovery',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'THEBLACKLIST',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@theblacklist',
    creator: '@theblacklist',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={`${inter.className} bg-blacklist-dark text-blacklist-text min-h-screen`}>
          <QueryProvider>
            {children}
          </QueryProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}