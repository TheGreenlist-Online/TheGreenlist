import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { AntiCommerceWarning } from '@/components/AntiCommerceWarning'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

const siteUrl = 'https://thegreenlist.online'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'The Green List - Cannabis Transparency and Accountability',
    template: '%s | The Green List',
  },
  description: 'Cannabis transparency, reporting, news, forums, and accountability platform.',
  keywords: 'cannabis transparency, cannabis reporting, cannabis news, forums, accountability, community trust',
  authors: [{ name: 'The Green List Team' }],
  applicationName: 'The Green List',
  openGraph: {
    title: 'The Green List',
    description: 'Cannabis transparency, reporting, news, forums, and accountability platform.',
    url: siteUrl,
    siteName: 'The Green List',
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
    title: 'The Green List',
    description: 'Cannabis transparency, reporting, news, forums, and accountability platform.',
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
          <AntiCommerceWarning />
          {children}
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}