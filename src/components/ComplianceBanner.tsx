import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'

export function ComplianceBanner() {
  return (
    <div className="sticky top-0 z-[60] border-b border-amber-300/30 bg-gradient-to-r from-[#1a1210]/95 via-[#231a12]/95 to-[#1a1210]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-3 px-4 py-3 text-center text-xs font-medium text-amber-100 sm:text-sm">
        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
        <p>
          The Green List is not a cannabis marketplace, dispensary, or sales platform. This is a transparency and
          community trust platform only.
          <Link href="/legal" className="ml-2 underline decoration-amber-300/80 underline-offset-2 hover:text-amber-200">
            Learn more
          </Link>
        </p>
      </div>
    </div>
  )
}
