import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { OrnatePanel } from '@/components/OrnatePanel'
import { Notice } from '@/components/record/Notice'
import { Section, Ledger } from '@/components/record'

export const metadata = {
  title: 'COA intake | The Green List',
  description: 'Understand laboratory certificates and prepare documentation for private review.',
}

export default function CoaPage() {
  return (
    <PageShell>
      <PageIntro
        title="Upload a Certificate of Analysis"
        lede="A Certificate of Analysis (COA) records a laboratory’s test results for a submitted sample. It can help you understand what was tested, which units were used, and what information is missing."
      />
      <section aria-labelledby="coa-upload-title" className="gl-document-hero mt-6">
        <div className="gl-document-hero__art" aria-hidden="true" />
        <OrnatePanel className="gl-document-hero__panel">
          <h2 id="coa-upload-title" className="greenlist-card-title">Upload COA</h2>
          <p className="mt-3">Prepare the original laboratory PDF or clear photographs of the full certificate, including its batch identifier.</p>
          <div id="coa-availability" className="mt-4">
            <Notice tone="review">
              COA submissions are not open yet. The private upload workflow requires staging validation before it is enabled.
            </Notice>
          </div>
          <button
            type="button"
            disabled
            aria-describedby="coa-availability coa-no-transfer"
            className="greenlist-primary-button mt-4 w-full justify-center cursor-not-allowed"
          >
            Choose file · Coming soon
          </button>
          <p id="coa-no-transfer" className="mt-3">No file is selected or sent from this page.</p>
        </OrnatePanel>
      </section>
      <Section title="Before contributing documentation">
        <Ledger rows={[
          { label: 'Private by default', value: 'You can contribute documentation without making a misconduct report. Documents are not automatically public.' },
          { label: 'Human review', value: 'Source authenticity, transcription review, and permission to publish are separate decisions. Extraction is not verification.' },
          { label: 'Batch-linked records', value: 'Keep the batch or package identifier so the document can be matched to the tested sample. An upload does not establish that a product is safe.' },
          { label: 'Original source', value: 'Download the original PDF from the laboratory or the product’s “View COA” link. A product-page summary or “TestPassed” label alone does not establish authenticity.' },
        ]} />
      </Section>
      <p className="mt-6">
        Need to submit evidence for an existing report instead?{' '}
        <Link href="/evidence/upload" className="gl-link">Open the existing evidence workflow</Link>.
        {' '}A COA alone should not require an allegation.
      </p>
    </PageShell>
  )
}
