import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Notice } from '@/components/record/Notice'

// Keep availability in sync with the server-side intake gate.
export const dynamic = 'force-dynamic'

export const metadata = { title: 'Understand and contribute a COA — The Green List' }

export default function CoaPage() {
  const enabled = process.env.COA_INTAKE_ENABLED === 'true'
  return <PageShell>
    <PageIntro eyebrow="Laboratory documentation" title="Start with the certificate" lede="A Certificate of Analysis (COA) records a laboratory’s test results for a submitted sample. It can help you understand what was tested, which units were used, and what information is missing." />
    <div className="gl-panel gl-panel__body mt-6 space-y-5">
      <h2 className="greenlist-card-title">Have a laboratory certificate?</h2>
      <p>Download the original PDF from the laboratory or the product’s “View COA” link. Keep the batch or package identifier so the document can later be matched to the right sample. A product-page summary or “TestPassed” label alone does not establish the original document’s authenticity.</p>
      <p>You can contribute documentation without making a misconduct report. The first intake step preserves your PDF privately and gives you a receipt. It does not extract results, verify the laboratory, publish a record, or establish that a product is safe.</p>
      <Notice tone="info">Source authenticity, transcription review, and permission to publish are separate decisions. An upload alone establishes none of them.</Notice>
      {enabled ? <Link href="/coa/submit" className="greenlist-primary-button">Submit a COA privately</Link> : <Notice tone="review">COA submissions are not open yet. The private upload workflow requires staging validation before it is enabled.</Notice>}
    </div>
  </PageShell>
}
