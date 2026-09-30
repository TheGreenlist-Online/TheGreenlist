import type { Metadata } from 'next'
import Link from 'next/link'
import { GovernancePage } from '@/components/GovernancePage'

export const metadata: Metadata = {
  title: 'Funding and Independence',
  description: 'Who pays for The Green List, what money can buy, and what it cannot.',
}

export default function FundingPage() {
  return (
    <GovernancePage
      title="Funding and Independence"
      lede="Public records, methodology, and consumer-facing verification tools are free to use. This document states how the work is paid for and what money cannot buy."
      documentId="GL-FND-0.1"
      reviewed="2026-09-26"
      status="Draft for comment"
    >
      <h2>The rule</h2>
      <p>
        <strong>No one can buy a better truth status.</strong> Verification labels, record content, report
        outcomes, moderation decisions, and the visibility of adverse records are not for sale, not negotiable, and
        not affected by any commercial relationship.
      </p>

      <h2>What is free</h2>
      <ul>
        <li>Searching and reading public records.</li>
        <li>Reading published findings, alerts, and corrections.</li>
        <li>The methodology, status definitions, and this funding statement.</li>
        <li>Submitting evidence, filing a report, and requesting a correction.</li>
      </ul>
      <p>Asking the public to pay for the truth would undermine the platform&apos;s purpose. There is no paywall on the record.</p>

      <h2>What may be paid for</h2>
      <p>Businesses and technical partners may pay for services that do not touch the record&apos;s substance:</p>
      <ul>
        <li>Workflow tools for managing documentation and responding to reports.</li>
        <li>Additional storage and richer profile presentation.</li>
        <li>API access and data-integration support.</li>
      </ul>
      <p>
        Paid features are separated from verification in the data model, the interface, and the legal terms. A paid
        profile cannot buy a higher status, suppress a recall or adverse record, remove a finding, or obtain a
        favourable review. Every paid relationship is disclosed on the record it concerns.
      </p>

      <h2>Funding sources</h2>
      <p>The platform intends to fund its work through a visibly separated mix of:</p>
      <ul>
        <li>Grants and philanthropic support for public-interest transparency work.</li>
        <li>Voluntary public support.</li>
        <li>Institutional partnerships governed by written independence terms.</li>
        <li>Paid, non-influence services as described above.</li>
      </ul>

      <h2>Current status</h2>
      <p>
        At this stage The Green List has no outside funders, sponsors, or paid partners. When any are accepted, they
        will be listed here by name, with the amount range, purpose, and the independence terms that apply. This
        list is a permanent part of the site.
      </p>

      <h2>Conflicts</h2>
      <p>
        Where a person involved in a record&apos;s review has a relationship with its subject, that person does not
        review the record, and the conflict is noted in the audit log. Questions about independence may be raised
        through <Link href="/contact">Contact</Link>.
      </p>
    </GovernancePage>
  )
}
