import type { SVGProps } from 'react'
import Link from 'next/link'
import { Mail } from 'lucide-react'

function GitHubIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.66-.22.66-.49 0-.24-.01-.87-.01-1.71-2.78.6-3.37-1.34-3.37-1.34-.45-1.15-1.11-1.45-1.11-1.45-.91-.62.07-.61.07-.61 1.01.07 1.54 1.03 1.54 1.03.9 1.54 2.36 1.1 2.94.84.09-.65.35-1.1.63-1.35-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.98 1.03-2.67-.1-.26-.45-1.28.1-2.66 0 0 .84-.27 2.75 1.03A9.6 9.6 0 0 1 12 6.8c.85.003 1.71.115 2.51.34 1.9-1.3 2.74-1.03 2.74-1.03.55 1.38.2 2.4.1 2.66.64.69 1.03 1.58 1.03 2.67 0 3.85-2.34 4.7-4.57 4.95.36.31.68.92.68 1.85 0 1.33-.01 2.4-.01 2.73 0 .27.16.58.67.48A10.01 10.01 0 0 0 22 12c0-5.52-4.48-10-10-10Z" />
    </svg>
  )
}

function TwitterIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      {...props}
    >
      <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.23 4.23 0 0 0 1.85-2.33 8.45 8.45 0 0 1-2.7 1.03 4.21 4.21 0 0 0-7.26 3.84A11.94 11.94 0 0 1 3.1 4.9a4.2 4.2 0 0 0 1.3 5.62 4.18 4.18 0 0 1-1.9-.52v.05a4.21 4.21 0 0 0 3.38 4.13 4.21 4.21 0 0 1-1.9.07 4.22 4.22 0 0 0 3.94 2.92 8.45 8.45 0 0 1-5.22 1.8A8.65 8.65 0 0 1 2 19.54a11.94 11.94 0 0 0 6.29 1.84c7.55 0 11.68-6.26 11.68-11.68l-.01-.53A8.18 8.18 0 0 0 22.46 6Z" />
    </svg>
  )
}

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
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <span className="font-bold text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                THEBLACKLIST.ONLINE
              </span>
            </Link>
            <p className="text-muted-foreground text-sm mb-4 max-w-md">
              A cannabis industry transparency network. Public accountability,
              consumer verification, and community-driven oversight for the cannabis marketplace.
            </p>
            <div className="flex items-center space-x-4">
              <Link
                href="https://twitter.com/theblacklist"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Visit our Twitter profile"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                <TwitterIcon className="h-5 w-5" />
              </Link>
              <Link
                href="https://github.com/theblacklist"
                target="_blank"
                rel="noreferrer noopener"
                aria-label="Visit our GitHub profile"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                <GitHubIcon className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:support@theblacklist.online"
                aria-label="Send us an email"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                <Mail className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Platform</h3>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal & Support</h3>
            <ul className="space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-accent transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2024 THEBLACKLIST.ONLINE. All rights reserved.
            </p>
            <p className="text-muted-foreground text-sm mt-2 md:mt-0">
              Not affiliated with any cannabis businesses or sales platforms.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}