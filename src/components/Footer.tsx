import Link from 'next/link'
import { GOVERNANCE_LINKS, LEGAL_NAV, PRIMARY_NAV, SUBMIT_EVIDENCE } from '@/config/navigation'

/**
 * Governance footer. Repeats the section map and the governance links so the
 * correction path, data sources and funding statement are reachable from the
 * bottom of every page as well as the top.
 */
export function Footer() {
  return (
    <footer className="gl-footer">
      <div className="gl-container gl-footer__grid">
        <div>
          <p className="gl-wordmark__name" style={{ fontSize: '1rem' }}>
            The <em>Green</em> List
          </p>
          <p className="gl-footer__statement mt-4">
            An independent public-interest records platform for the cannabis market. The Green List documents
            what is known, what is missing, where the evidence came from, and what cannot yet be verified.
          </p>
          <p className="gl-footer__statement mt-3">
            No paid verification. No paid removal. No hidden sponsorship. The platform does not sell cannabis,
            list products for sale, certify products as safe, or approve businesses.
          </p>
        </div>

        <div>
          <h3>Sections</h3>
          <ul>
            {PRIMARY_NAV.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Governance</h3>
          <ul>
            {GOVERNANCE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
            <li>
              <Link href={SUBMIT_EVIDENCE.href}>{SUBMIT_EVIDENCE.label}</Link>
            </li>
            <li>
              <Link href="/help">Help</Link>
            </li>
          </ul>
        </div>

        <div>
          <h3>Legal</h3>
          <ul>
            {LEGAL_NAV.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/api-docs">API documentation</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="gl-container gl-footer__bottom">
        <span>© 2026 The Green List · thegreenlist.online</span>
        <span>Records are reviewed against stated sources. Every published claim carries a status, a date, and a correction path.</span>
      </div>
    </footer>
  )
}
