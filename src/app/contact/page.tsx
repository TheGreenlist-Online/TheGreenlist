import Link from 'next/link'
import { ContactIntakeForm } from '@/app/contact/contact-intake-form'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Ledger } from '@/components/record'

export const metadata = {
  title: 'Contact - The Green List',
}

export default function ContactPage() {
  return (
    <PageShell width="record">
      <PageIntro
        eyebrow="Contact"
        title="Contact the desk"
        lede="General questions, account or access matters, and data or institutional requests. Reports and corrections have their own routes and are not handled through this form."
      />

      <div className="mt-2 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <ContactIntakeForm />

        <Ledger
          title="Other routes"
          rows={[
            {
              label: 'File a report',
              value: (
                <Link href="/reports/new" className="gl-link">
                  Reports desk
                </Link>
              ),
              note: 'Received privately; reviewed before any outcome is recorded.',
            },
            {
              label: 'Correct a record',
              value: (
                <Link href="/about/corrections" className="gl-link">
                  Corrections process
                </Link>
              ),
              note: 'Logged; original wording kept in the record history.',
            },
            {
              label: 'Legal notices',
              value: 'legal@thegreenlist.online',
              note: 'Takedown requests and compliance questions. 5 to 10 business days.',
            },
            {
              label: 'Scope',
              value: 'This form does not enable sales, payments, ordering, delivery, or inventory transactions of any kind.',
            },
          ]}
        />
      </div>
    </PageShell>
  )
}
