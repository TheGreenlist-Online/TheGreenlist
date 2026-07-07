'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

const sponsoredContent = [
  {
    id: '1',
    title: 'Independent Cannabis Testing Lab',
    description: 'Lab testing education and public safety resources',
    link: 'https://example.com/lab',
    type: 'affiliate',
  },
  {
    id: '2',
    title: 'Legal Aid Services',
    description: 'Cannabis law education and consultation resources',
    link: 'https://example.com/legal',
    type: 'sponsored',
  },
  {
    id: '3',
    title: 'Worker Rights Organization',
    description: 'Support for cannabis industry workers',
    link: 'https://example.com/workers',
    type: 'affiliate',
  },
]

export function SponsoredContent() {
  return (
    <div className="space-y-4">
      <div className="glass-card rounded-lg p-5">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground/60">
          Sponsored
        </p>

        <div className="space-y-4">
          {sponsoredContent.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Link
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group block"
              >
                <div className="mb-2 overflow-hidden rounded aspect-video bg-white/4 border border-accent/10 flex items-center justify-center">
                  <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">
                    Sponsored Content
                  </div>
                </div>
                <h4 className="text-sm font-semibold text-foreground mb-0.5 group-hover:text-accent transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-1.5 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-accent/70">
                  <span>{item.type === 'affiliate' ? 'Affiliate Link' : 'Sponsored'}</span>
                  <ExternalLink className="h-2.5 w-2.5" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-orange-500/15 bg-orange-950/10 p-4">
        <p className="text-[10px] text-muted-foreground/70 leading-relaxed">
          <strong className="text-orange-400/80">FTC Disclosure:</strong> Some links are affiliate
          links. We may earn a commission at no extra cost to you. The Green List does not sell or
          facilitate the sale of cannabis products.
        </p>
      </div>
    </div>
  )
}