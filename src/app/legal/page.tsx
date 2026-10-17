import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Ledger, Notice, RecordList, RecordRow } from '@/components/record'

export const metadata = {
  title: 'Legal and compliance - The Green List',
  description: 'Terms, privacy, disclosures, and copyright policy for The Green List.',
}

const DOCUMENTS = [
  { title: 'Terms of use', href: '/legal/terms', body: 'Conditions governing use of the records, submissions, and discussion, including the enforcement ladder.' },
  { title: 'Privacy policy', href: '/legal/privacy', body: 'What personal data is collected, why, how long it is kept, and how to request export or deletion.' },
  { title: 'Paid relationships disclosure', href: '/legal/ftc', body: 'Where any sponsorship, affiliate, or compensated placement would be disclosed, and the standard that applies.' },
  { title: 'Copyright policy', href: '/legal/dmca', body: 'Digital Millennium Copyright Act notice and takedown procedure.' },
]

export default function LegalHub() {
  return (
    <PageShell width="reading">
      <PageIntro
        eyebrow="Legal"
        title="Legal and compliance"
        lede="The documents that govern the platform, and the standing notices that apply to every page."
        meta={
          <span>
            <strong>Contact</strong> legal@thegreenlist.online
          </span>
        }
      />

      <Notice tone="info" className="mt-2" title="The Green List is not a marketplace, dispensary, or e-commerce platform.">
        It does not sell, distribute, ship, arrange delivery of, order, or facilitate the sale of cannabis products in any form. The
        platform publishes business records, reviewed report outcomes, source-linked Learn resources, aggregated outlet coverage, and
        the discussion attached to those records.
      </Notice>

      <section className="mt-8" aria-label="Documents">
        <RecordList ariaLabel="Legal documents">
          {DOCUMENTS.map((doc) => (
            <RecordRow key={doc.href} href={doc.href} title={doc.title} body={doc.body} />
          ))}
        </RecordList>
      </section>

      <div className="mt-8">
        <Ledger
          title="Standing notices"
          rows={[
            {
              label: 'Age',
              value: 'Use of the site is limited to people at least 21 years of age or the minimum legal age in their jurisdiction.',
            },
            {
              label: 'Jurisdiction',
              value: 'Cannabis regulation varies by state and locality. Records state the jurisdiction they concern; consult the relevant regulator for current law.',
            },
            {
              label: 'Submitted content',
              value: 'Reports are private on receipt and are published only as reviewed, source-backed findings. Discussion is published for documentation and review; it is not a finding of The Green List.',
            },
            {
              label: 'Moderation',
              value: 'Published standards are enforced against harassment, defamation, and unlawful activity. The enforcement ladder is set out in the Terms of use.',
            },
            {
              label: 'Legal notices',
              value: 'Send takedown requests, legal notices, and compliance questions to legal@thegreenlist.online. Response within 5 to 10 business days.',
            },
          ]}
        />
      </div>
    </PageShell>
  )
}
