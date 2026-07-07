'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, MessageSquare, TrendingUp } from 'lucide-react'

const forumCategories = [
  {
    id: 'cultivation',
    name: 'Cultivation',
    description: 'Grow operations, techniques, and industry practices',
    accentColor: 'rgba(57,255,136,0.7)',
    slug: 'cultivation',
  },
  {
    id: 'dispensaries',
    name: 'Dispensaries',
    description: 'Customer experiences, product quality, and service reviews',
    accentColor: 'rgba(96,165,250,0.7)',
    slug: 'dispensaries',
  },
  {
    id: 'consumer-safety',
    name: 'Consumer Safety',
    description: 'Product testing, contamination reports, and safety concerns',
    accentColor: 'rgba(248,113,113,0.7)',
    slug: 'consumer-safety',
  },
  {
    id: 'worker-rights',
    name: 'Worker Rights',
    description: 'Labor practices, wage issues, and workplace conditions',
    accentColor: 'rgba(192,132,252,0.7)',
    slug: 'worker-rights',
  },
  {
    id: 'legal-aid',
    name: 'Legal Aid',
    description: 'Cannabis law, compliance, and legal resources',
    accentColor: 'rgba(250,204,21,0.7)',
    slug: 'legal-aid',
  },
  {
    id: 'news-investigations',
    name: 'News & Investigations',
    description: 'Industry news, investigative reporting, and breaking stories',
    accentColor: 'rgba(251,146,60,0.7)',
    slug: 'news-investigations',
  },
]

export function FeaturedForums() {
  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-2xl font-black uppercase tracking-tight text-foreground sm:text-3xl">
          Featured Forums
        </h2>
        <Link
          href="/forums"
          className="text-sm font-semibold text-accent hover:text-accent/80 transition-colors"
        >
          View all →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {forumCategories.map((forum, index) => (
          <motion.div
            key={forum.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
          >
            <Link href={`/forums/${forum.slug}`} className="block h-full">
              <div className="glass-card group h-full rounded-lg p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      background: forum.accentColor,
                      boxShadow: `0 0 8px ${forum.accentColor}`,
                    }}
                  />
                  <h3
                    className="font-semibold text-base text-foreground group-hover:text-accent transition-colors"
                  >
                    {forum.name}
                  </h3>
                </div>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2 leading-relaxed">
                  {forum.description}
                </p>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>1.2K</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>342</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-accent font-semibold">
                    <TrendingUp className="h-3.5 w-3.5" />
                    <span>Hot</span>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}