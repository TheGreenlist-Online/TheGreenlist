import Link from 'next/link'
import { GOVERNANCE_LINKS, SUBMIT_EVIDENCE } from '@/config/navigation'

/**
 * The thin governance line above the header. It establishes accountability
 * before anything else loads: how records are made, where data comes from,
 * who pays, and how to correct the record. "Submit Evidence" is the only
 * emphasised link.
 */
export function UtilityNav() {
  return (
    <div className="gl-utility">
      <div className="gl-container gl-utility__inner">
        <span className="gl-utility__title">Cannabis Records &amp; Accountability</span>
        <nav aria-label="Governance" className="gl-utility__links">
          {GOVERNANCE_LINKS.map((item, index) => (
            <Link
              key={item.href}
              href={item.href}
              className={index === 0 || index === GOVERNANCE_LINKS.length - 1 ? undefined : 'is-mobile-hidden'}
            >
              {item.label}
            </Link>
          ))}
          <span className="gl-utility__sep" aria-hidden="true" />
          <Link href={SUBMIT_EVIDENCE.href} className="is-emphasis">
            {SUBMIT_EVIDENCE.label}
          </Link>
        </nav>
      </div>
    </div>
  )
}
