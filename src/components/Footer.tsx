import Link from 'next/link'

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
}

export function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-[#070a08]">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <p className="text-lg font-semibold tracking-tight text-zinc-100">The Green List</p>
          <p className="mt-3 max-w-sm text-sm text-zinc-300">
            Transparency, accountability, forums, reports, evidence, and trust signals for the cannabis community.
          </p>
        </div>

        <div>
          <h3 className="font-semibold text-emerald-200">Platform</h3>
          <ul className="mt-3 space-y-2">
            {footerLinks.platform.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="text-sm text-zinc-300 transition hover:text-emerald-300">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-semibold text-emerald-200">Legal</h3>
          <ul className="mt-3 space-y-2">
            {footerLinks.legal.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="text-sm text-zinc-300 transition hover:text-emerald-300">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-zinc-500">
        © 2026 The Green List · Built for Truth. Driven by Community.
      </div>
    </footer>
  )
}
