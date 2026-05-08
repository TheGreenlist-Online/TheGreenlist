'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TrendingUp, Hash } from 'lucide-react'

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
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="h-5 w-5 text-accent" />
        <h3 className="font-semibold">Trending Topics</h3>
      </div>

      <div className="space-y-3">
        {trendingTopics.map((topic, index) => (
          <motion.div
            key={topic.tag}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.05 }}
          >
            <Link
              href={`/search?q=${encodeURIComponent(topic.tag)}`}
              className="flex items-center justify-between p-2 rounded-md hover:bg-accent/10 transition-colors group"
            >
              <div className="flex items-center space-x-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium group-hover:text-accent">
                  {topic.tag.replace('-', ' ')}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  {topic.count}
                </span>
                <TrendingUp
                  className={`h-3 w-3 ${
                    topic.trend === 'up'
                      ? 'text-green-500'
                      : topic.trend === 'down'
                      ? 'text-red-500'
                      : 'text-muted-foreground'
                  }`}
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t">
        <Link
          href="/trending"
          className="text-sm font-medium text-accent hover:text-accent/80"
        >
          View all trending →
        </Link>
      </div>
    </div>
  )
}