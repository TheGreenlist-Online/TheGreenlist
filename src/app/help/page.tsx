import { SimplePage } from '@/components/SimplePage'
import { EVIDENCE_DESK_NAV_ITEM } from '@/config/navigation'

export const metadata = {
  title: 'Help - The Green List',
}

export default function HelpPage() {
  return (
    <SimplePage
      eyebrow="Reference"
      documentId="GL-DOC-HELP"
      title="Using the records"
      subtitle="How to read a record, what the status labels mean, how to file a report, and where to send a correction."
      sections={[
        {
          heading: 'Reading a record',
          body: 'Every business, report, and Learn resource carries a record identifier, a status label, the source class it rests on, the date it was last reviewed, and a limitations statement. A status label describes the state of the record, not a judgement about the subject.',
        },
        {
          heading: 'Status labels',
          body: 'Identity verified means the record holder has been confirmed to represent the business. Under review means a submission has been received and is being checked. Not verified means no identity check has been completed. Report outcomes are labelled substantiated, unsubstantiated, or inconclusive, and each outcome links to the evidence it rests on.',
        },
        {
          heading: 'Filing a report',
          body: 'Reports are received privately and are not published as submitted. Provide dates, locations, documents, and any correspondence. Reviewers may ask the business for a response before an outcome is recorded. Reports that cannot be checked are closed as inconclusive rather than published.',
        },
        {
          heading: 'Corrections',
          body: 'If a record is wrong or out of date, use the corrections process linked from every record. Corrections are logged, the original wording is kept in the record history, and the reviewer who made the change is recorded.',
        },
        {
          heading: 'Discussion',
          body: `The ${EVIDENCE_DESK_NAV_ITEM.label} holds discussion threads attached to records. Discussion is not verification: nothing posted there becomes a finding until a reviewer has checked it against a source.`,
        },
      ]}
    />
  )
}
