'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'

const productForumData: Record<string, any> = {
  'sativa-blend': {
    name: 'Sativa Blend',
    members: 1200,
    discussions: [
      {
        id: 1,
        title: 'Best time to consume for creative projects?',
        author: 'CreativeUser',
        replies: 24,
        views: 312,
        lastReply: '2 hours ago',
        pinned: true
      },
      {
        id: 2,
        title: 'Growing tips for maximizing yield',
        author: 'GreenThumb',
        replies: 15,
        views: 189,
        lastReply: '5 hours ago'
      },
      {
        id: 3,
        title: 'Comparing Sativa Blend to other popular strains',
        author: 'StrainExplorer',
        replies: 32,
        views: 456,
        lastReply: '1 day ago'
      },
      {
        id: 4,
        title: 'First time trying - any advice?',
        author: 'NewConsumer',
        replies: 18,
        views: 234,
        lastReply: '3 hours ago'
      },
      {
        id: 5,
        title: 'Terpene profile and anxiety reduction',
        author: 'HealthFocus',
        replies: 22,
        views: 298,
        lastReply: '8 hours ago'
      }
    ]
  },
  'indica-reserve': {
    name: 'Indica Reserve',
    members: 1450,
    discussions: [
      {
        id: 1,
        title: 'Sleep quality improvements - share your experience',
        author: 'BetterSleep',
        replies: 45,
        views: 567,
        lastReply: '1 hour ago',
        pinned: true
      },
      {
        id: 2,
        title: 'Medical uses and pain management',
        author: 'PatientVoice',
        replies: 33,
        views: 421,
        lastReply: '4 hours ago'
      }
    ]
  }
}

export default function ProductForumPage({ params }: { params: { slug: string } }) {
  const forum = productForumData[params.slug] || productForumData['sativa-blend']
  const [sortBy, setSortBy] = useState('recent')

  return (
    <div className="min-h-screen bg-blacklist-dark">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <Link href={`/products/${params.slug}`} className="text-muted hover:text-blacklist-green-bright mb-4 inline-block">
          ← Back to Product
        </Link>
        <h1 className="heading-lg mb-2">{forum.name} Community Forum</h1>
        <p className="text-muted">{forum.members.toLocaleString()} members discussing this product</p>
      </div>

      <div className="container mx-auto px-4 pb-12">
        {/* Create Discussion & Sort */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <button className="btn-primary">
            Start New Discussion
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-blacklist-gray border border-blacklist-gray-light/30 text-blacklist-text px-4 py-2 rounded-lg focus:outline-none focus:border-blacklist-accent-red"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Popular</option>
            <option value="active">Most Active</option>
            <option value="unanswered">Unanswered</option>
          </select>
        </div>

        {/* Discussions List */}
        <div className="space-y-4">
          {forum.discussions.map((discussion: any, index: number) => (
            <motion.div
              key={discussion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`#discussion-${discussion.id}`}>
                <div className={`card-elevated p-6 rounded-lg hover:accent-glow transition-all duration-300 ${
                  discussion.pinned ? 'border-l-4 border-blacklist-accent-red' : ''
                }`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-blacklist-text hover:text-blacklist-accent-red transition-colors">
                          {discussion.title}
                        </h3>
                        {discussion.pinned && (
                          <span className="badge-red text-xs">Pinned</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted">
                        <span>by <span className="text-blacklist-green-bright">{discussion.author}</span></span>
                        <span>•</span>
                        <span>Last reply {discussion.lastReply}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="space-y-1">
                        <div>
                          <span className="font-bold text-blacklist-accent-yellow">{discussion.replies}</span>
                          <span className="text-muted text-sm ml-1">replies</span>
                        </div>
                        <div>
                          <span className="text-muted text-sm">{discussion.views} views</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center gap-2 mt-12">
          <button className="px-4 py-2 rounded-lg bg-blacklist-gray/50 text-muted hover:text-blacklist-text transition-colors">
            ← Previous
          </button>
          <button className="px-4 py-2 rounded-lg bg-blacklist-green-bright text-blacklist-dark font-bold">
            1
          </button>
          <button className="px-4 py-2 rounded-lg bg-blacklist-gray/50 text-muted hover:text-blacklist-text transition-colors">
            2
          </button>
          <button className="px-4 py-2 rounded-lg bg-blacklist-gray/50 text-muted hover:text-blacklist-text transition-colors">
            3
          </button>
          <button className="px-4 py-2 rounded-lg bg-blacklist-gray/50 text-muted hover:text-blacklist-text transition-colors">
            Next →
          </button>
        </div>
      </div>
    </div>
  )
}