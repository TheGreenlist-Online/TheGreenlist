'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Hash, Minus, TrendingDown, TrendingUp } from 'lucide-react'

const trendingTopics = [
  { tag: 'price-gouging', count: 1247, trend: 'up' },
  { tag: 'contaminated-product', count: 892, trend: 'up' },
  { tag: 'worker-rights', count: 654, trend: 'up' },
  { tag: 'misleading-ads', count: 521, trend: 'down' },
  { tag: 'dispensary-reviews', count: 423, trend: 'up' },
  { tag: 'legal-compliance', count: 398, trend: 'stable' },
  { tag: 'grow-operations', count: 312, trend: 'up' },
  { tag: 'consumer-safety', count: 289, trend: 'up' },
]

export function TrendingTopics() {
  return (
    <div className="glass-card rounded-lg p-5">
      <div className="mb-5 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-accent" />
        <h3 className="font-display text-sm font-bold uppercase tracking-wide text-foreground">Trending Topics</h3>
      </div>

      <div className="space-y-1">
        {trendingTopics.map((topic, index) => (
          <motion.div
            key={topic.tag}
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
          >
            <Link
              href={`/search?q=${encodeURIComponent(topic.tag)}`}
              className="group flex items-center justify-between rounded-md px-3 py-2 transition-colors hover:bg-accent/8"
            >
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
                <span className="capitalize text-sm text-muted-foreground transition-colors group-hover:text-accent">
                  {topic.tag.replace(/-/g, ' ')}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-xs text-muted-foreground/70">{topic.count.toLocaleString()}</span>
                {topic.trend === 'up' ? <TrendingUp className="h-3 w-3 text-green-400" /> : null}
                {topic.trend === 'down' ? <TrendingDown className="h-3 w-3 text-red-400" /> : null}
                {topic.trend === 'stable' ? <Minus className="h-3 w-3 text-muted-foreground/50" /> : null}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 border-t border-accent/10 pt-4">
        <Link href="/trending" className="text-xs font-semibold text-accent transition-colors hover:text-accent/80">
          View all trending →
        </Link>
      </div>
    </div>
  )
}
