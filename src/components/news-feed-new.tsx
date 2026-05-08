'use client'

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'

// Mock data for now
const mockNews = [
  {
    id: '1',
    title: 'New Testing Standards Announced for 2024',
    summary: 'Cannabis testing facilities receive updated guidelines for product safety...',
    source: 'Industry Updates',
    publishedAt: '2 hours ago',
    tags: ['testing', 'safety']
  },
  {
    id: '2',
    title: 'Community Strain Reviews: Top Picks This Month',
    summary: 'Users share their favorite strains and effects experienced...',
    source: 'Community News',
    publishedAt: '4 hours ago',
    tags: ['reviews', 'strains']
  },
  {
    id: '3',
    title: 'Dispensary Opens New Location in Colorado',
    summary: 'Popular dispensary chain expands with state-of-the-art facility...',
    source: 'Dispensary News',
    publishedAt: '1 day ago',
    tags: ['dispensaries', 'expansion']
  }
]

export function NewsFeed() {
  const { data: news } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      return mockNews
    }
  })

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <h2 className="heading-lg text-center mb-12">Latest News & Community Updates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news?.map((article, index) => (
            <motion.article
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card-elevated p-6 rounded-lg hover:accent-glow transition-all duration-300"
            >
              <div className="flex flex-wrap gap-2 mb-3">
                {article.tags.map((tag) => (
                  <span key={tag} className="badge text-xs">
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="text-lg font-semibold mb-2 text-blacklist-text hover:text-blacklist-accent-red transition-colors">
                {article.title}
              </h3>
              <p className="text-muted text-sm mb-4">
                {article.summary}
              </p>
              <div className="flex justify-between items-center text-xs text-muted">
                <span>{article.source}</span>
                <span className="text-blacklist-accent-yellow">{article.publishedAt}</span>
              </div>
            </motion.article>
          ))}
        </div>
        <div className="text-center mt-12">
          <button className="btn-secondary">
            View All News
          </button>
        </div>
      </div>
    </section>
  )
}