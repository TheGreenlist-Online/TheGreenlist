import type { Metadata } from 'next'
import './globals.css'
import { Archivo, IBM_Plex_Mono } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Providers } from './providers'
import { SiteFrame } from '@/components/SiteFrame'
import { Footer } from '@/components/Footer'
import { APPEARANCE_BOOT_SCRIPT } from '@/lib/appearance'

// Two families, site-wide. Archivo carries interface and editorial hierarchy;
// IBM Plex Mono carries citations, record IDs, dates, and status labels.
// No display or novelty faces: the shell is the identity.
const sans = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

const siteUrl = 'https://thegreenlist.online'
const siteDescription =
  'The Green List is an independent public-interest records platform for the cannabis market. It documents what is known, what is missing, where the evidence came from, and what cannot yet be verified.'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'The Green List — Cannabis Records & Accountability',
    template: '%s | The Green List',
  },
  description: siteDescription,
  keywords:
    'cannabis records, cannabis transparency, cannabis accountability, license records, lab testing records, certificate of analysis, recalls, public records',
  authors: [{ name: 'The Green List' }],
  applicationName: 'The Green List',
  openGraph: {
    title: 'The Green List — Cannabis Records & Accountability',
    description: siteDescription,
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
    title: 'The Green List — Cannabis Records & Accountability',
    description: siteDescription,
    images: ['/og-image.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <head>
        {/* Applies saved display preferences before first paint. */}
        <script dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }} />
      </head>
      <body className="font-sans">
        <a href="#main-content" className="gl-skip-link">
          Skip to content
        </a>
        <Providers>
          <SiteFrame footer={<Footer />}>{children}</SiteFrame>
        </Providers>
        <SpeedInsights />
      </body>
    </html>
  )
}
