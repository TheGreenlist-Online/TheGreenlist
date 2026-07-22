import Link from 'next/link'
import { SimplePage } from '@/components/SimplePage'

export default function EducationPage() {
  return (
    <>
      <SimplePage
        title="Knowledge Library"
        subtitle="Cannabis education, policy context, consumer protection, and public-interest resources."
        sections={[
          {
            heading: 'Education before promotion',
            body: 'Resources are reviewed for accuracy, sourcing, safety, and compliance. The library does not provide cannabis sales, ordering, delivery, or medical advice.',
          },
          {
            heading: 'Human-reviewed contributions',
            body: 'Authenticated contributors may submit educational material. Publication and sensitive decisions remain subject to accountable human review.',
          },
        ]}
      />
      <div className="mx-auto -mt-10 mb-16 max-w-7xl px-4 text-center">
        <Link href="/education/new" className="font-semibold text-emerald-300 hover:underline">
          Submit educational material for review →
        </Link>
      </div>
    </>
  )
}
