import type { Metadata } from 'next'
import Link from 'next/link'
import { GovernancePage } from '@/components/GovernancePage'

export const metadata: Metadata = {
  title: 'About',
  description: 'What The Green List is, what it is not, and how it is governed.',
}

export default function AboutPage() {
  return (
    <GovernancePage
      title="About The Green List"
      lede="An independent public-interest records platform that makes cannabis business, licence, testing, and compliance information readable, comparable, and checkable against its sources."
      documentId="GL-GOV-0.1"
      reviewed="2026-09-26"
      status="Draft for comment"
    >
      <h2>Purpose</h2>
      <p>
        Legal cannabis markets generate a great deal of compliance data — licences, seed-to-sale tracking, laboratory
        results, recalls, enforcement actions — but almost none of it reaches the person holding a package in a store
        in a form they can read, compare, or trust. Rules differ by state. Laboratory methods differ. A “lab-tested”
        label can mean many things.
      </p>
      <p>
        The Green List exists to sit between those fragmented systems and the public. It documents what is known
        about a business or product, what is missing, where each fact came from, when it was last checked, and what
        cannot yet be verified. The gaps are published alongside the facts, because the gaps are the point.
      </p>

      <h2>What The Green List is</h2>
      <ul>
        <li>A records platform. Every published claim links to a source, a status, a date, and a correction path.</li>
        <li>An accountability platform. Reports are structured, reviewed, and labelled — allegations are never presented as findings.</li>
        <li>A translation layer. State-specific rules are shown as state-specific; results are never presented as comparable when methods differ.</li>
        <li>Independent. Verification status, record content, and moderation outcomes cannot be bought. See <Link href="/about/funding">Funding &amp; Independence</Link>.</li>
      </ul>

      <h2>What The Green List is not</h2>
      <ul>
        <li>Not a marketplace. It does not sell cannabis, list products for sale, take orders, or coordinate delivery.</li>
        <li>Not a regulator. It does not license, inspect, certify, or approve anyone.</li>
        <li>Not a safety authority. It does not declare products safe, clean, or medical-grade.</li>
        <li>Not a review site. It does not rank businesses by popularity or publish star ratings.</li>
        <li>Not a social network. Public discussion exists to locate documents and correct the record, not to build followings.</li>
      </ul>

      <h2>How the platform is organised</h2>
      <p>
        <strong>Records</strong> hold business, licence, and documentation entries. <strong>Reports</strong> hold
        structured accountability reports and their review status. <strong>Evidence</strong> is a private-by-default
        intake for documents. <strong>News</strong> carries source-linked coverage. <strong>Standards</strong> defines
        the status vocabulary and review rules. <strong>Learn</strong> explains testing, labelling, and consumer
        rights. The <strong>Evidence Desk</strong> is where the public helps locate primary documents and flags
        errors.
      </p>

      <h2>Current stage</h2>
      <p>
        The Green List is early. Records are being built section by section, and most of the platform&apos;s
        eventual data connections — regulator registries, laboratory feeds, recall notices — are not yet in place.
        Where a section is not yet populated, it says so. Numbers are published only when they can be substantiated.
      </p>

      <h2>Contact</h2>
      <p>
        Corrections, right-of-reply requests, source suggestions, and general enquiries: see{' '}
        <Link href="/about/corrections">Corrections</Link> and <Link href="/contact">Contact</Link>.
      </p>
    </GovernancePage>
  )
}
