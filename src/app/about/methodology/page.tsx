import type { Metadata } from 'next'
import Link from 'next/link'
import { GovernancePage } from '@/components/GovernancePage'

export const metadata: Metadata = {
  title: 'Methodology and Standards',
  description: 'How Green List records are built, reviewed, labelled, and limited.',
}

const statuses = [
  ['Official source confirmed', 'confirmed', 'A government or regulator source directly supports the stated fact.'],
  ['Primary document verified', 'confirmed', 'A source document was reviewed and linked to the listed record.'],
  ['Business-reported', 'neutral', 'The business submitted the information; it is not independently confirmed.'],
  ['Partially documented', 'review', 'Some relevant evidence exists, but meaningful documentation is missing.'],
  ['Requires update', 'review', 'The record or its source is older than the platform’s freshness threshold.'],
  ['Under review', 'review', 'The information is being assessed; no public conclusion is implied.'],
  ['Official alert active', 'alert', 'A source-linked regulator alert, recall, hold, or warning applies.'],
  ['Not publicly available', 'neutral', 'The information may exist but could not be located in reviewed public sources.'],
  ['Cannot verify', 'neutral', 'The platform cannot substantiate the claim using available evidence.'],
] as const

export default function MethodologyPage() {
  return (
    <GovernancePage
      title="Methodology and Standards"
      lede="How records are built, what each status means, how reports move through review, and what a record does not establish."
      documentId="GL-METH-0.1"
      reviewed="2026-09-26"
      status="Draft for comment"
    >
      <h2>The five-question rule</h2>
      <p>Every record page must let a reader answer these within a few seconds:</p>
      <ol>
        <li>What is this record about?</li>
        <li>What is its current status?</li>
        <li>Where did the information come from?</li>
        <li>When was it last checked or updated?</li>
        <li>What is unknown, missing, disputed, or outside The Green List&apos;s scope?</li>
      </ol>
      <p>
        A page that cannot answer all five is not finished. Empty fields are shown as “not disclosed”, “not
        available”, or “cannot verify” — never hidden.
      </p>

      <h2>Status vocabulary</h2>
      <p>
        The same words, colours, and definitions are used on every record. Colour supports the label; it never
        replaces it.
      </p>
      <div className="gl-panel my-6">
        <table className="gl-ledger">
          <tbody>
            {statuses.map(([label, tone, meaning]) => (
              <tr key={label}>
                <th scope="row">
                  <span className={`gl-status gl-status--${tone}`}>{label}</span>
                </th>
                <td>{meaning}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        The platform never uses “approved”, “safe”, “clean”, “certified”, “best”, or “trusted”, and never shows a
        green mark without a scope statement saying exactly what was checked.
      </p>

      <h2>Verification without endorsement</h2>
      <p>
        A verification label describes a specific check against a specific source on a specific date — for example,
        “official licence record located and matched to the listed legal entity”. It is not a judgement of product
        quality, safety, or business conduct, and it is not a recommendation to purchase.
      </p>

      <h2>Report review</h2>
      <p>Reports move through a fixed set of states, visible to the person who filed them:</p>
      <ol>
        <li><strong>Received</strong> — the report exists in the private intake.</li>
        <li><strong>Needs information</strong> — reviewers have asked for documentation or clarification.</li>
        <li><strong>Under review</strong> — the report is being assessed against available evidence.</li>
        <li><strong>Published finding</strong> — a source-backed finding has been published. Only this state produces public content.</li>
        <li><strong>Closed</strong> — the report could not be substantiated or falls outside scope.</li>
        <li><strong>Corrected</strong> — a published finding was amended; the change is logged.</li>
      </ol>
      <p>
        Incoming reports are private by default. An allegation is never published as a finding. When a finding
        concerns an identifiable business, that business is offered a right of reply before or at publication.
      </p>

      <h2>Jurisdiction</h2>
      <p>
        Cannabis rules are set state by state. Every record states the jurisdiction whose rules apply, and testing
        information distinguishes between “state requires this test”, “state does not require this test”, “tested
        voluntarily”, and “information unavailable”. Results tested under different methods or thresholds are not
        presented as comparable.
      </p>

      <h2>Freshness</h2>
      <p>
        Records carry the date they were last checked against their source. Licence status, in particular, is only
        as current as that date. Records older than the freshness threshold are labelled “requires update”.
      </p>

      <h2>Human review</h2>
      <p>
        Automated tools may suggest labels, surface inconsistencies, or flag content for attention. They do not
        publish findings, change verification status, remove records, or suspend accounts. Those actions require a
        named human reviewer and are written to an audit log.
      </p>

      <h2>What this methodology does not establish</h2>
      <p>
        The Green List has not independently evaluated the safety of any product. It does not hold laboratory
        accreditation. It cannot confirm that a certificate of analysis represents an entire batch rather than the
        submitted sample. These limits are stated on every record they affect.
      </p>

      <p>
        To dispute anything published under this methodology, see <Link href="/about/corrections">Corrections</Link>.
      </p>
    </GovernancePage>
  )
}
