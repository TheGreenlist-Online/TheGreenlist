import Link from 'next/link'
import type { Metadata } from 'next'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'

export const metadata: Metadata = {
  title: 'Certificates of Analysis | The Green List',
  description: 'Learn how The Green List will receive, review, and explain cannabis laboratory certificates. Public COA submissions are not yet open.',
}

export default function CoaInformationPage() {
  return (
    <PageShell>
      <PageIntro
        title="Understand Certificates of Analysis"
        lede="A Certificate of Analysis (COA) records laboratory testing for a particular sample. The Green List is building a way to connect these documents to product batches and make the test results easier to understand without treating a document as proof of safety or authenticity."
        meta={
          <>
            <span>Public submissions: not open yet</span>
            <span>Private upload: staging validation</span>
            <span>Human review required</span>
          </>
        }
        actions={
          <Link href="/evidence" className="greenlist-secondary-button">
            Learn about existing evidence intake
          </Link>
        }
      />

      <section className="gl-section" aria-labelledby="coa-availability">
        <div className="gl-panel">
          <div className="gl-panel__head">
            <h2 id="coa-availability">COA submission portal: coming soon</h2>
          </div>
          <div className="gl-panel__body">
            <p className="text-sm leading-7 text-[var(--gl-text-secondary)]">
              COA submissions are currently closed. We are validating private file storage,
              access controls, document processing, and human review in staging before
              allowing public uploads. This page does not accept or transfer files.
            </p>
            <p className="mt-4 text-sm leading-7 text-[var(--gl-text-secondary)]">
              You will not need to make an allegation to submit a COA when the dedicated
              intake becomes available. The existing report and correction workflows
              remain separate.
            </p>
          </div>
        </div>
      </section>

      <section className="gl-section" aria-labelledby="coa-explained">
        <div className="gl-section__head">
          <h2 id="coa-explained">What will a COA record explain?</h2>
          <p>Source documents first. Interpretation only where the evidence supports it.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="gl-panel gl-panel__body">
            <h3 className="greenlist-card-title">Product and batch</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--gl-text-secondary)]">
              Product names, laboratory sample IDs, batch identifiers, and dates as
              written in the document, with uncertain matches marked clearly.
            </p>
          </div>
          <div className="gl-panel gl-panel__body">
            <h3 className="greenlist-card-title">Laboratory measurements</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--gl-text-secondary)]">
              Cannabinoids, terpenes, and contaminant panels, including their reported
              units, detection limits, and tests that were not performed.
            </p>
          </div>
          <div className="gl-panel gl-panel__body">
            <h3 className="greenlist-card-title">Evidence and review status</h3>
            <p className="mt-3 text-sm leading-6 text-[var(--gl-text-secondary)]">
              Separate labels for transcription review, source authenticity, and
              publication. A submitted PDF or AI extraction is not automatically verified.
            </p>
          </div>
        </div>
      </section>

      <section className="gl-section" aria-labelledby="coa-process">
        <div className="gl-section__head">
          <h2 id="coa-process">How submissions will be handled</h2>
        </div>
        <ol className="grid gap-3 text-sm leading-7 text-[var(--gl-text-secondary)]">
          <li>1. Secure private upload, after the workflow passes staging tests.</li>
          <li>2. File validation and structured extraction with source references.</li>
          <li>3. Human review of proposed values, document origin, and discrepancies.</li>
          <li>4. Separate authorization before any information is published.</li>
        </ol>
        <p className="gl-limitations mt-6">
          A laboratory certificate describes the submitted sample, not necessarily every
          item in a batch. A reported pass does not establish independent safety or
          regulatory compliance. Original files stay private unless separately approved
          for publication.
        </p>
      </section>
    </PageShell>
  )
}
