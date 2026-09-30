import Link from 'next/link'

/**
 * Persistent scope statement. A records platform must say, on every page,
 * what it is not: it does not sell cannabis, certify safety, or approve
 * businesses. Plain text, no icon, no colour alarm.
 */
export function DisclosureBar() {
  return (
    <div className="gl-disclosure" role="note" aria-label="Platform scope">
      <div className="gl-container gl-disclosure__inner">
        <span className="gl-disclosure__label">Scope</span>
        <p className="m-0">
          The Green List documents available evidence and its limits. It does not sell cannabis, list products for sale,
          certify products as safe, or approve businesses.{' '}
          <Link href="/about/methodology">Read the methodology</Link>.
        </p>
      </div>
    </div>
  )
}
