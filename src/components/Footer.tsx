import Link from 'next/link'
import { Mail } from 'lucide-react'

const footerLinks = {
  platform: [
    { name: 'Forums', href: '/forums' },
    { name: 'Businesses', href: '/businesses' },
    { name: 'News', href: '/news' },
    { name: 'Reports', href: '/reports' },
  ],
  legal: [
    { name: 'Terms of Service', href: '/legal/terms' },
    { name: 'Privacy Policy', href: '/legal/privacy' },
    { name: 'FTC Disclosures', href: '/legal/ftc' },
    { name: 'DMCA', href: '/legal/dmca' },
  ],
  support: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'Help Center', href: '/help' },
    { name: 'Report Issue', href: '/report' },
    { name: 'API Docs', href: '/api-docs' },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-accent/20 bg-background/90">
      <div className="glow-border h-px w-full opacity-60" />
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="mb-4 flex items-center space-x-2">
              <span className="bg-gradient-to-r from-accent via-primary to-foreground bg-clip-text text-xl font-bold text-transparent">
                The Green List
              </span>
            </Link>
            <p className="mb-4 max-w-md text-sm text-muted-foreground">
              A cannabis transparency and accountability platform for reports,
              forums, news, education, and community trust.
            </p>
            <div className="flex space-x-4">
              <Link href="https://twitter.com/thegreenlist" className="text-muted-foreground transition-colors hover:text-accent">
                <span className="text-sm font-bold">X</span>
              </Link>
              <Link href="https://github.com/TheGreenList" className="text-muted-foreground transition-colors hover:text-accent">
                <span className="text-sm font-bold">GH</span>
              </Link>
              <Link href="mailto:support@thegreenlist.online" className="text-muted-foreground transition-colors hover:text-accent">
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-accent">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold">Legal & Support</h3>
            <ul className="space-y-2">
              {[...footerLinks.legal, ...footerLinks.support].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-accent">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-accent/15 pt-8">
          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
            <p className="text-sm text-muted-foreground">
              © 2024 The Green List. All rights reserved.
            </p>
            <p className="text-sm text-muted-foreground">
              Not affiliated with cannabis sales, ordering, delivery, checkout, or inventory platforms.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
