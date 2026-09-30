import type { Metadata } from 'next'
import Link from 'next/link'
import { GovernancePage } from '@/components/GovernancePage'

export const metadata: Metadata = {
  title: 'Data Sources',
  description: 'Where Green List information comes from, how it is obtained, and how each source is labelled.',
}

export default function SourcesPage() {
  return (
    <GovernancePage
      title="Data Sources"
      lede="Where the information comes from, how it is obtained, and how the origin of every fact is labelled on the record."
      documentId="GL-SRC-0.1"
      reviewed="2026-09-26"
      status="Draft for comment"
    >
      <h2>Source classes</h2>
      <p>Every fact on a record is attributed to one of the following source classes, in descending order of weight:</p>
      <ol>
        <li><strong>Official records</strong> — state regulator registries, licence databases, enforcement notices, and recall bulletins, cited to the issuing body and retrieval date.</li>
        <li><strong>Primary documents</strong> — laboratory-issued certificates of analysis, licences, and formal correspondence reviewed by the platform and linked to the record.</li>
        <li><strong>Authenticated business submissions</strong> — information supplied by a business through a claimed profile. Labelled “business-reported” until independently confirmed.</li>
        <li><strong>Public disclosures</strong> — published statements, product pages, and press materials, cited to their location.</li>
        <li><strong>Public and community submissions</strong> — documents, leads, and reports from members of the public. These enter the private intake and are never published without review.</li>
      </ol>

      <h2>How information is obtained</h2>
      <ul>
        <li>Public official records are consulted directly from the issuing body and cited with a retrieval date.</li>
        <li>Documents are accepted through the private evidence intake, with consent and retention terms shown at upload.</li>
        <li>Businesses may claim their record and submit documentation; claims are reviewed before any change to the public record.</li>
        <li>The platform does not access systems it is not authorised to use, and does not republish restricted documents. It stores source facts and cites their location.</li>
      </ul>

      <h2>What is shown on the record</h2>
      <p>Each attributed fact displays the source class, the issuing body or document type, the retrieval or review date, and the verification method. Where a source cannot be shown publicly — for example, a document supplied under confidentiality — the record states that a source exists, its class, and why it is withheld.</p>

      <h2>News coverage</h2>
      <p>
        The <Link href="/news">News</Link> section aggregates coverage from named public outlets and links to the
        original publication. Aggregated items are not Green List findings and are labelled by their outlet.
      </p>

      <h2>Current connections</h2>
      <p>
        At this stage The Green List does not yet operate automated feeds from state regulators, seed-to-sale
        systems, or laboratories. Official records are checked manually and dated accordingly. As data connections
        are established they will be listed here with their scope, refresh interval, and known limitations.
      </p>

      <h2>Privacy</h2>
      <p>
        Personal information in submissions is scrubbed from anything published. Anonymous reports remain anonymous
        to the public and to the businesses they concern. See the <Link href="/legal/privacy">Privacy Policy</Link>.
      </p>
    </GovernancePage>
  )
}
