import type { Metadata } from 'next'
import './globals.css'
import { Rampart_One, Permanent_Marker, Rubik_Puddles } from 'next/font/google'

const rampart = Rampart_One({ weight: '400', subsets: ['latin'], variable: '--font-graffiti', display: 'swap' })
const marker = Permanent_Marker({ weight: '400', subsets: ['latin'], variable: '--font-marker', display: 'swap' })
const puddles = Rubik_Puddles({ weight: '400', subsets: ['latin'], variable: '--font-drip', display: 'swap' })
import { Providers } from './providers'
import { ComplianceBanner } from '@/components/ComplianceBanner'
import { SiteFrame } from '@/components/SiteFrame'
import { SmokeBackground } from '@/components/SmokeBackground'

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
    <html lang="en" className={`${rampart.variable} ${marker.variable} ${puddles.variable}`}>
      <body className="font-sans">
        <SmokeBackground />
        <Providers>
          <ComplianceBanner />
          <SiteFrame>{children}</SiteFrame>
        </Providers>
      </body>
    </html>
  )
}
