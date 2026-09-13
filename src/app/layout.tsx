import type { Metadata } from 'next'
import './globals.css'
import { Inter, Permanent_Marker } from 'next/font/google'

// Inter remains the interface voice. Permanent Marker is scoped to the public
// hero so the official system can carry a controlled street-art accent.
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

const expressive = Permanent_Marker({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-expressive',
  display: 'swap',
})
import { Providers } from './providers'
import { ComplianceBanner } from '@/components/ComplianceBanner'
import { SiteFrame } from '@/components/SiteFrame'
import { Footer } from '@/components/Footer'
import { SmokeBackground } from '@/components/SmokeBackground'
import { APPEARANCE_BOOT_SCRIPT } from '@/lib/appearance'

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
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
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
    <html lang="en" className={`${inter.variable} ${expressive.variable}`}>
      <head>
        {/* Applies the saved calm-background preference before first paint so the
            backdrop never flashes at full strength. */}
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
      </head>
      <body className="font-sans">
        <SmokeBackground />
        <Providers>
          <ComplianceBanner />
          <SiteFrame footer={<Footer />}>{children}</SiteFrame>
        </Providers>
      </body>
    </html>
  )
}
