'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, Hash, TrendingDown, Minus } from 'lucide-react'

const trendingTopics = [
  { tag: 'price-gouging',        count: 1247, trend: 'up' },
  { tag: 'contaminated-product', count: 892,  trend: 'up' },
  { tag: 'worker-rights',        count: 654,  trend: 'up' },
  { tag: 'misleading-ads',       count: 521,  trend: 'down' },
  { tag: 'dispensary-reviews',   count: 423,  trend: 'up' },
  { tag: 'legal-compliance',     count: 398,  trend: 'stable' },
  { tag: 'grow-operations',      count: 312,  trend: 'up' },
  { tag: 'consumer-safety',      count: 289,  trend: 'up' },
]

export function TrendingTopics() {
  return (
    <div className="glass-card rounded-lg p-5">
      <div className="flex items-center gap-2 mb-5">
        <TrendingUp className="h-4 w-4 text-accent" />
        <h3 className="font-display font-bold uppercase tracking-wide text-sm text-foreground">
          Trending Topics
        </h3>
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
              className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-accent/8 transition-colors group"
            >
              <div className="flex items-center gap-2">
                <Hash className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                <span className="text-sm text-muted-foreground group-hover:text-accent transition-colors capitalize">
                  {topic.tag.replace(/-/g, ' ')}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground/70">
                  {topic.count.toLocaleString()}
                </span>
                {topic.trend === 'up' && (
                  <TrendingUp className="h-3 w-3 text-green-400" />
                )}
                {topic.trend === 'down' && (
                  <TrendingDown className="h-3 w-3 text-red-400" />
                )}
                {topic.trend === 'stable' && (
                  <Minus className="h-3 w-3 text-muted-foreground/50" />
                )}
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-accent/10">
        <Link
          href="/trending"
          className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
        >
          View all trending →
        </Link>
      </div>
    </div>
  )
}