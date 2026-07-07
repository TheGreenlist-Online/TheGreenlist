'use client'

import { useState } from 'react'
import { X, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LegalDisclaimer() {
  const [isVisible, setIsVisible] = useState(true)

  if (!isVisible) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(5, 8, 7, 0.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(57,255,136,0.12)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.5)',
      }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <ShieldAlert className="h-4 w-4 text-yellow-400/80 mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-xs leading-relaxed">
              <span className="font-bold text-foreground/80 mr-1">Legal Disclaimer:</span>
              <span className="text-muted-foreground">
                The Green List does not sell, distribute, order, deliver, or facilitate the sale of
                cannabis products. All content is user-submitted and for informational purposes only.
                External links may lead to third-party sites. Consult local laws regarding cannabis use.
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
            className="shrink-0 h-7 w-7 p-0 text-muted-foreground hover:text-accent"
            aria-label="Dismiss disclaimer"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}