import type { Metadata } from 'next'
import Link from 'next/link'
import { GovernancePage } from '@/components/GovernancePage'
import { CORRECTION_REQUEST_TYPE } from '@/lib/report-types'

export const metadata: Metadata = {
  title: 'Corrections',
  description: 'How to submit a private request to correct a published Green List record and what to expect from review.',
}

export default function CorrectionsPage() {
  return (
    <GovernancePage
      title="Corrections"
      lede="Any published record may be disputed. This document explains how to submit a request and what the existing review process provides."
      documentId="GL-COR-0.1"
      reviewed="2026-09-26"
      status="Draft for comment"
    >
      <h2>Who may request a correction</h2>
      <p>
        Any reader may request a correction. Businesses that are the subject of a record, members of the public,
        regulators, laboratories, and journalists may submit a request. The intake requires an account; you will be
        asked to sign in before submitting.
      </p>

      <h2>How to request one</h2>
      <ol>
        <li>Identify the record and the specific statement in dispute.</li>
        <li>State what you believe the record should say.</li>
        <li>Attach primary documentation where possible — an official record, a licence, a laboratory document, or formal correspondence.</li>
        <li>
          After signing in, submit through the{' '}
          <Link href={`/evidence/upload?type=${CORRECTION_REQUEST_TYPE}`}>correction-request intake</Link>. The
          form opens with the “Correction request” type selected; attach your documentation there.
        </li>
      </ol>
      <p>
        The intake confirms receipt. Requests are private on receipt; if review results in a public finding, the finding
        may be published. Attached evidence remains in private storage.
      </p>

      <h2>How requests are handled</h2>
      <ul>
        <li>An authorised reviewer can update the request&apos;s review state after assessing available sources and documentation.</li>
        <li>Filing a request does not itself change a published record. An outcome depends on review; no response time or correction is guaranteed.</li>
        <li>The submitter can check the current state from their reports page after signing in.</li>
      </ul>

      <h2>Status and audit records</h2>
      <p>
        Report status changes are timestamped, and reviewer actions are recorded in the administrative audit log when
        logging succeeds. The submitter&apos;s report page shows the current state; it is not a complete public revision
        history for every published record.
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
