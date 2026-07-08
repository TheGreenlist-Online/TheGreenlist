import { ShieldAlert } from 'lucide-react'

export function AntiCommerceWarning() {
  return (
    <div className="w-full trust-strip" role="banner" aria-label="Compliance notice">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-4 w-4 shrink-0 text-orange-400" aria-hidden="true" />
          <p className="text-xs font-semibold leading-tight text-orange-200/80">
            <span className="mr-1 font-bold uppercase tracking-wide text-orange-300">Compliance Notice:</span>
            The Green List is not a cannabis marketplace, dispensary, or sales platform. This is a transparency and
            community trust platform only.{' '}
            <a href="/legal" className="underline decoration-orange-400/60 underline-offset-2 transition-colors hover:text-orange-200">
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
