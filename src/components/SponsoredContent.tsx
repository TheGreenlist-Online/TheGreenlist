'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'

const sponsoredContent = [
  {
    id: '1',
    title: 'Independent Cannabis Testing Lab',
    description: 'Independent lab testing education and public safety resources',
    image: '/sponsored/lab.jpg',
    link: 'https://example.com/lab',
    type: 'affiliate',
  },
  {
    id: '2',
    title: 'Legal Aid Services',
    description: 'Cannabis law education and consultation resources',
    image: '/sponsored/legal.jpg',
    link: 'https://example.com/legal',
    type: 'sponsored',
  },
  {
    id: '3',
    title: 'Worker Rights Organization',
    description: 'Support for cannabis industry workers',
    image: '/sponsored/workers.jpg',
    link: 'https://example.com/workers',
    type: 'affiliate',
  },
]

export function SponsoredContent() {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-6">
        <h3 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wide">
          Sponsored
        </h3>

        <div className="space-y-4">
          {sponsoredContent.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block group"
              >
                <div className="relative overflow-hidden rounded-md bg-muted aspect-video mb-3">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-muted-foreground text-sm">Sponsored Content</span>
                  </div>
                </div>

                <h4 className="font-medium text-sm mb-1 group-hover:text-accent transition-colors">
                  {item.title}
                </h4>
                <p className="text-xs text-muted-foreground mb-2">
                  {item.description}
                </p>

                <div className="flex items-center space-x-1 text-xs text-accent">
                  <span>
                    {item.type === 'affiliate' ? 'Affiliate Link' : 'Sponsored'}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <div className="text-xs text-muted-foreground text-center">
          <p className="mb-2">
            <strong>FTC Disclosure:</strong> Some links are affiliate links.
            We may earn a commission at no extra cost to you.
          </p>
          <p>
            The Green List does not sell or facilitate the sale of cannabis products.
          </p>
        </div>
      </div>
    </div>
  )
}