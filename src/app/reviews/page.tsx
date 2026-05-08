'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const strains = [
  {
    id: 1,
    name: 'Sativa Blend',
    type: 'Sativa',
    rating: 4.8,
    reviews: 234,
    thc: '18-22%',
    effects: ['Energetic', 'Creative', 'Focus'],
    image: '⚡'
  },
  {
    id: 2,
    name: 'Indica Reserve',
    type: 'Indica',
    rating: 4.9,
    reviews: 312,
    thc: '20-24%',
    effects: ['Relaxing', 'Sleep', 'Calm'],
    image: '🌙'
  },
  {
    id: 3,
    name: 'Hybrid Gold',
    type: 'Hybrid',
    rating: 4.7,
    reviews: 189,
    thc: '16-20%',
    effects: ['Balanced', 'Uplifting', 'Relaxing'],
    image: '⭐'
  },
  {
    id: 4,
    name: 'Blue Dream',
    type: 'Sativa',
    rating: 4.6,
    reviews: 428,
    thc: '17-21%',
    effects: ['Energetic', 'Creative', 'Happy'],
    image: '☁️'
  },
  {
    id: 5,
    name: 'OG Kush',
    type: 'Indica',
    rating: 4.8,
    reviews: 567,
    thc: '19-25%',
    effects: ['Relaxing', 'Pain Relief', 'Sleep'],
    image: '🌿'
  },
  {
    id: 6,
    name: 'Girl Scout Cookies',
    type: 'Hybrid',
    rating: 4.9,
    reviews: 612,
    thc: '18-25%',
    effects: ['Euphoric', 'Relaxing', 'Creative'],
    image: '🍪'
  }
]

export default function ReviewsPage() {
  const [filterType, setFilterType] = useState('all')
  const [sortBy, setSortBy] = useState('rating')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStrains = strains.filter(s => {
    const matchesType = filterType === 'all' || s.type.toLowerCase() === filterType.toLowerCase()
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  const sortedStrains = [...filteredStrains].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating
    if (sortBy === 'reviews') return b.reviews - a.reviews
    return 0
  })

  return (
    <div className="min-h-screen bg-blacklist-dark">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <h1 className="heading-lg mb-4">Strain Discovery & Reviews</h1>
        <p className="text-muted text-lg mb-8">
          Explore strains and read real reviews from the cannabis community.
        </p>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <input
            type="text"
            placeholder="Search strains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-blacklist-gray border border-blacklist-gray-light/30 text-blacklist-text px-4 py-3 rounded-lg focus:outline-none focus:border-blacklist-accent-red"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-blacklist-gray border border-blacklist-gray-light/30 text-blacklist-text px-4 py-3 rounded-lg focus:outline-none focus:border-blacklist-accent-red"
          >
            <option value="all">All Types</option>
            <option value="sativa">Sativa</option>
            <option value="indica">Indica</option>
            <option value="hybrid">Hybrid</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-blacklist-gray border border-blacklist-gray-light/30 text-blacklist-text px-4 py-3 rounded-lg focus:outline-none focus:border-blacklist-accent-red"
          >
            <option value="rating">Top Rated</option>
            <option value="reviews">Most Reviewed</option>
          </select>
        </div>

        {/* Strains Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStrains.map((strain, index) => (
            <motion.div
              key={strain.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/products/${strain.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="card-elevated p-6 rounded-lg hover:accent-glow transition-all duration-300 h-full">
                  <div className="text-4xl mb-4">{strain.image}</div>
                  <h3 className="text-lg font-bold text-blacklist-text mb-2 hover:text-blacklist-accent-red transition-colors">
                    {strain.name}
                  </h3>
                  <div className="mb-4">
                    <span className="badge text-xs">{strain.type}</span>
                    <div className="mt-2 text-sm">
                      <span className="text-blacklist-accent-red font-bold">{strain.thc}</span>
                      <span className="text-muted text-xs ml-1">THC</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-blacklist-accent-yellow">★ {strain.rating}</span>
                    <span className="text-muted text-sm">({strain.reviews})</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {strain.effects.map((effect) => (
                      <span key={effect} className="text-xs bg-blacklist-green-bright/10 text-blacklist-green-bright px-2 py-1 rounded">
                        {effect}
                      </span>
                    ))}
                  </div>

                  <button className="btn-secondary w-full mt-4 text-xs">
                    View & Review
                  </button>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {sortedStrains.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted text-lg mb-4">No strains found matching your search.</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setFilterType('all')
              }}
              className="btn-secondary"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  )
}