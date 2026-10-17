import type { Metadata } from 'next'
import Link from 'next/link'
import { GovernancePage } from '@/components/GovernancePage'
import { CORRECTION_REQUEST_TYPE } from '@/lib/report-types'

export const metadata: Metadata = {
  title: 'Corrections',
  description: 'How to dispute or correct a published Green List record, and how corrections are logged.',
}

export default function CorrectionsPage() {
  return (
    <GovernancePage
      title="Corrections"
      lede="Any published record may be disputed. This document describes how to request a correction, how requests are handled, and how every change to the record is logged."
      documentId="GL-COR-0.1"
      reviewed="2026-09-26"
      status="Draft for comment"
    >
      <h2>Who may request a correction</h2>
      <p>
        Anyone. Businesses that are the subject of a record, members of the public, regulators, laboratories, and
        journalists may all request a correction. Businesses may also claim their record to respond directly.
      </p>

      <h2>How to request one</h2>
      <ol>
        <li>Identify the record and the specific statement in dispute.</li>
        <li>State what you believe the record should say.</li>
        <li>Attach primary documentation where possible — an official record, a licence, a laboratory document, or formal correspondence.</li>
        <li>
          Submit through the{' '}
          <Link href={`/evidence/upload?type=${CORRECTION_REQUEST_TYPE}`}>correction-request intake</Link>. The
          form opens with the “Correction request” type selected; attach your documentation there.
        </li>
      </ol>
      <p>Requests are private. The fact that a correction has been requested is not published until a decision is made.</p>

      <h2>How requests are handled</h2>
      <ul>
        <li>Receipt is acknowledged.</li>
        <li>A reviewer without a conflict of interest assesses the request against the record&apos;s sources and the supplied documentation.</li>
        <li>Where the record is wrong, it is corrected and the change is logged with the date and reason.</li>
        <li>Where the record is right, the requester is told why, with reference to the sources.</li>
        <li>Where the evidence is inconclusive, the record is labelled “under review” or “disputed” rather than left unchanged.</li>
      </ul>

      <h2>Right of reply</h2>
      <p>
        When a published finding concerns an identifiable business, that business may publish a response alongside
        the finding. Responses are labelled as the business&apos;s statement and are not edited except to remove
        personal information about third parties.
      </p>

      <h2>The correction log</h2>
      <p>
        Every change to a published record — corrections, updated documents, status changes, and removals — is
        timestamped and shown on the record&apos;s timeline. Corrections are not silent. Removed content is replaced
        with a notice stating that content was removed and why, unless doing so would itself cause harm.
      </p>

      <h2>What a correction is not</h2>
      <p>
        A correction request is not a mechanism for removing accurate, source-backed information because it is
        unfavourable. Payment, legal pressure, or commercial relationship does not affect the outcome. See{' '}
        <Link href="/about/funding">Funding &amp; Independence</Link>.
      </p>
    </GovernancePage>
  )
}
