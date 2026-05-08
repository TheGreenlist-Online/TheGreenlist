import Link from 'next/link'
import { Github, Twitter, Mail } from 'lucide-react'

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
            <div className="flex space-x-4">
              <Link
                href="https://twitter.com/theblacklist"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="https://github.com/theblacklist"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                <Github className="h-5 w-5" />
              </Link>
              <Link
                href="mailto:support@theblacklist.online"
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