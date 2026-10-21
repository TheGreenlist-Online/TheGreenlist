import Link from 'next/link'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Ledger, LimitationsPanel, Section } from '@/components/record'

export const metadata = {
  title: 'Evidence intake - The Green List',
  description: 'Private-by-default document intake supporting accountability reports and correction requests.',
}

export default function EvidencePage() {
  return (
    <PageShell>
      <PageIntro
        title="Evidence intake"
        lede="Attach photographs, receipts, labels, screenshots, PDFs, and written records to a report or a correction request. Submissions are private on receipt and remain private while authorised reviewers assess them."
        meta={
          <>
            <span>Private on receipt</span>
            <span>Reviewed by staff</span>
            <span>Never auto-published</span>
          </>
        }
        actions={
          <>
            <Link href="/reports/new" className="greenlist-secondary-button">
              File a report
            </Link>
            <Link href="/evidence/upload" className="greenlist-primary-button">
              Submit evidence
            </Link>
          </>
        }
      />

      <Section title="How submissions are handled" aside={<span>Applies to every file</span>}>
        <Ledger
          rows={[
            { label: 'Storage', value: 'Files are stored in a private bucket. They are never exposed through public file URLs.' },
            { label: 'Access', value: 'Limited to the submitting account and authorised reviewers under platform policy. Access is logged.' },
            { label: 'Review', value: 'Documentation supports human review. A file does not, by itself, make an allegation public or a fact confirmed.' },
            { label: 'Publication', value: 'Only findings supported by reviewed documentation are published, and the source class is stated on the record.' },
            { label: 'Retention', value: 'Files linked to a closed report are retained with the record of the review. Removal requests go through the correction path.' },
          ]}
        />
      </Section>

      <Section title="What to submit" aside={<span>Primary documents preferred</span>}>
        <Ledger
          rows={[
            { label: 'Certificates of analysis', value: 'The full document with laboratory name, batch identifier, and date. Screenshots of summary pages are weaker evidence.' },
            { label: 'Labels and packaging', value: 'Photographs showing the batch number, test date, and licensee name legibly.' },
            { label: 'Receipts and invoices', value: 'Establishing where and when a product was obtained.' },
            { label: 'Official correspondence', value: 'Regulator notices, licence letters, recall communications.' },
            { label: 'Written accounts', value: 'Dated, first-hand, and specific. Identify what you observed directly and what you were told.' },
          ]}
        />
      </Section>

      <LimitationsPanel subject="report" />
    </PageShell>
  )
}
