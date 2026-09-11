import Link from 'next/link'
import Image from 'next/image'

const footerLinks = {
  platform: [
    { name: 'Forums', href: '/forums' },
    { name: 'Businesses', href: '/businesses' },
    { name: 'News', href: '/news' },
    { name: 'Reports', href: '/reports' },
    { name: 'Evidence', href: '/evidence' },
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
    <footer className="site-footer mt-16">
      <div className="site-footer__rule" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <Image
              src="/brand/greenlist-mark.png"
              alt="The Green List"
              width={104}
              height={104}
              className="site-footer__mark"
            />
            <div className="leading-tight">
              <p className="text-base font-bold tracking-tight text-[#f7f7f2]">
                The <span className="text-[#a3d93b]">Green</span> List
              </p>
              <p className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-[#949c94]">
                thegreenlist.online
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-[#949c94]">
            Transparency, accountability, forums, reports, evidence, and trust signals for the
            cannabis community.
          </p>
        </div>

        <div>
          <h3>Platform</h3>
          <ul className="mt-4 space-y-2.5">
            {footerLinks.platform.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="text-sm">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Legal</h3>
          <ul className="mt-4 space-y-2.5">
            {footerLinks.legal.map((link) => (
              <li key={link.name}>
                <Link href={link.href} className="text-sm">
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/[.06] py-5 text-center text-xs text-[#6f766f]">
        © 2026 The Green List · Built for Truth. Driven by Community.
      </div>
    </footer>
  )
}
