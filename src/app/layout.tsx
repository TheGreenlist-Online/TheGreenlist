import type { CSSProperties } from 'react'
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { ComplianceBanner } from '@/components/ComplianceBanner'
import { SiteFrame } from '@/components/SiteFrame'
import { Footer } from '@/components/Footer'
import { SmokeBackground } from '@/components/SmokeBackground'
import { APPEARANCE_BOOT_SCRIPT } from '@/lib/appearance'

const FONT_VARIABLES = {
  '--font-sans': '"Inter", system-ui, sans-serif',
  '--font-expressive': '"Permanent Marker", "Segoe Print", cursive',
  '--font-display': '"Bebas Neue", Impact, sans-serif',
  '--font-stencil': '"Anton", Impact, sans-serif',
  '--font-heavy': '"Archivo Black", Impact, sans-serif',
  '--font-mural': '"Fugaz One", Impact, sans-serif',
  '--font-brush': '"Kaushan Script", cursive',
  '--font-slab': '"Alfa Slab One", serif',
} as CSSProperties

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
    <html lang="en" style={FONT_VARIABLES}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Permanent+Marker&family=Bebas+Neue&family=Anton&family=Archivo+Black&family=Fugaz+One&family=Kaushan+Script&family=Alfa+Slab+One&display=swap"
          rel="stylesheet"
        />
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
