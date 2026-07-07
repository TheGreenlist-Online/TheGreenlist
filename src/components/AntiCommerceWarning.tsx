'use client'

import { ShieldAlert } from 'lucide-react'

export function AntiCommerceWarning() {
  return (
    <div
      className="w-full trust-strip"
      role="banner"
      aria-label="Compliance notice"
    >
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-4 w-4 shrink-0 text-orange-400" aria-hidden="true" />
          <p className="text-xs font-semibold text-orange-200/80 leading-tight">
            <span className="text-orange-300 font-bold uppercase tracking-wide mr-1">
              Compliance Notice:
            </span>
            The Green List is not a cannabis marketplace, dispensary, or sales platform.
            This is a transparency and community trust platform only.{' '}
            <a
              href="/legal"
              className="underline underline-offset-2 decoration-orange-400/60 hover:text-orange-200 transition-colors"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

