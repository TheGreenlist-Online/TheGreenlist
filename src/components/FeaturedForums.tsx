'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users, MessageSquare, TrendingUp } from 'lucide-react'

const forumCategories = [
  {
    id: 'cultivation',
    name: 'Cultivation',
    description: 'Grow operations, techniques, and industry practices',
    color: 'bg-green-500',
    slug: 'cultivation',
  },
  {
    id: 'dispensaries',
    name: 'Dispensaries',
    description: 'Customer experiences, product quality, and service reviews',
    color: 'bg-blue-500',
    slug: 'dispensaries',
  },
  {
    id: 'consumer-safety',
    name: 'Consumer Safety',
    description: 'Product testing, contamination reports, and safety concerns',
    color: 'bg-red-500',
    slug: 'consumer-safety',
  },
  {
    id: 'worker-rights',
    name: 'Worker Rights',
    description: 'Labor practices, wage issues, and workplace conditions',
    color: 'bg-purple-500',
    slug: 'worker-rights',
  },
  {
    id: 'legal-aid',
    name: 'Legal Aid',
    description: 'Cannabis law, compliance, and legal resources',
    color: 'bg-yellow-500',
    slug: 'legal-aid',
  },
  {
    id: 'news-investigations',
    name: 'News & Investigations',
    description: 'Industry news, investigative reporting, and breaking stories',
    color: 'bg-orange-500',
    slug: 'news-investigations',
  },
]

export function FeaturedForums() {
  return (
    <section className="py-12">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Featured Forums</h2>
        <Link
          href="/forums"
          className="text-sm font-medium text-accent hover:text-accent/80"
        >
          View all forums →
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {forumCategories.map((forum, index) => (
          <motion.div
            key={forum.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Link href={`/forums/${forum.slug}`}>
              <div className="group relative overflow-hidden rounded-lg border bg-card p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`h-3 w-3 rounded-full ${forum.color}`} />
                  <h3 className="font-semibold text-lg">{forum.name}</h3>
                </div>

                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                  {forum.description}
                </p>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>1.2K</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-4 w-4" />
                      <span>342</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-accent">
                    <TrendingUp className="h-4 w-4" />
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