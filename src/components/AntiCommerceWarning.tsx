'use client'

import { AlertTriangle } from 'lucide-react'

export function AntiCommerceWarning() {
  return (
    <div className="w-full bg-gradient-to-r from-blacklist-accent-red via-orange-600 to-blacklist-accent-red text-white py-3 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center space-x-3 text-sm font-semibold">
          <AlertTriangle className="h-5 w-5 flex-shrink-0" />
          <p>
            ⚠️ THEBLACKLIST.ONLINE is NOT a cannabis marketplace, dispensary, or sales platform.
            This is a transparency and community platform only.
            <a href="/legal" className="underline ml-2 hover:opacity-80 transition-opacity">
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
