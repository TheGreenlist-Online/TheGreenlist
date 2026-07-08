import Link from 'next/link'
import { Mail, Shield } from 'lucide-react'

const footerLinks = {
  platform: [
    { name: 'Forums', href: '/forums' },
    { name: 'Businesses', href: '/businesses' },
    { name: 'News', href: '/news' },
    { name: 'Reports', href: '/reports' },
    { name: 'Education', href: '/education/new' },
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
    <footer
      className="border-t"
      style={{
        borderColor: 'rgba(57,255,136,0.10)',
        background: 'rgba(4,8,6,0.95)',
      }}
    >
      <div className="glow-border h-px w-full opacity-50" />
      <div className="container mx-auto px-4 py-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="group mb-5 inline-flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-sm border border-accent/30 bg-accent/8"
                style={{ boxShadow: '0 0 12px rgba(57,255,136,0.15)' }}
              >
                <Shield className="h-4 w-4 text-accent" />
              </div>
              <span
                className="font-display text-xl font-black uppercase tracking-tight"
                style={{
                  background: 'linear-gradient(120deg, #39ff88 0%, #22c55e 55%, #f0fdf4 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                The Green List
              </span>
            </Link>
            <p className="mb-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
              A cannabis transparency and accountability platform for reports, forums, news, education, and community
              trust. Not a marketplace. Not a dispensary.
            </p>
            <div className="flex items-center gap-4">
              <Link href="https://twitter.com/thegreenlist" className="text-sm font-bold text-muted-foreground transition-colors hover:text-accent">
                X
              </Link>
              <Link href="https://github.com/TheGreenList" className="text-sm font-bold text-muted-foreground transition-colors hover:text-accent">
                GH
              </Link>
              <Link href="mailto:support@thegreenlist.online" className="text-muted-foreground transition-colors hover:text-accent">
                <Mail className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-foreground/80">Platform</h3>
            <ul className="space-y-2.5">
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
            <h3 className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-foreground/80">Legal & Support</h3>
            <ul className="space-y-2.5">
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

        <div className="mt-10 border-t border-accent/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-2 md:flex-row">
            <p className="text-xs text-muted-foreground/70">© {new Date().getFullYear()} The Green List. All rights reserved.</p>
            <p className="text-center text-xs text-muted-foreground/60">
              Not affiliated with cannabis sales, ordering, delivery, checkout, or inventory platforms.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
