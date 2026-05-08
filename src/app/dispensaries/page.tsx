'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

const dispensaries = [
  {
    id: 1,
    name: 'Green Valley Dispensary',
    location: 'Denver, CO',
    rating: 4.8,
    reviews: 342,
    hours: 'Open now',
    distance: '2.3 mi',
    specialties: ['Premium Flower', 'Concentrates', 'Edibles'],
    image: '🏪'
  },
  {
    id: 2,
    name: 'Mountain Peak Cannabis',
    location: 'Boulder, CO',
    rating: 4.6,
    reviews: 287,
    hours: 'Closed',
    distance: '8.7 mi',
    specialties: ['Flower', 'Tinctures', 'Topicals'],
    image: '🏬'
  },
  {
    id: 3,
    name: 'Pure Leaf Collective',
    location: 'Aurora, CO',
    rating: 4.9,
    reviews: 521,
    hours: 'Open now',
    distance: '12.1 mi',
    specialties: ['Organic', 'Premium Concentrates'],
    image: '🌿'
  },
  {
    id: 4,
    name: 'Sunny Side Cannabis',
    location: 'Littleton, CO',
    rating: 4.7,
    reviews: 198,
    hours: 'Open now',
    distance: '5.2 mi',
    specialties: ['Budget-Friendly', 'Variety'],
    image: '☀️'
  }
]

export default function DispensariesPage() {
  const [sortBy, setSortBy] = useState('rating')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredDispensaries = dispensaries.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const sortedDispensaries = [...filteredDispensaries].sort((a, b) => {
    if (sortBy === 'rating') return b.rating - a.rating
    if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance)
    if (sortBy === 'reviews') return b.reviews - a.reviews
    return 0
  })

  return (
    <div className="min-h-screen bg-blacklist-dark">
      {/* Header */}
      <div className="container mx-auto px-4 py-12">
        <h1 className="heading-lg mb-4">Find Dispensaries</h1>
        <p className="text-muted text-lg mb-8">
          Browse trusted dispensaries in your area with real community reviews.
        </p>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-blacklist-gray border border-blacklist-gray-light/30 text-blacklist-text px-4 py-3 rounded-lg focus:outline-none focus:border-blacklist-accent-red"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-blacklist-gray border border-blacklist-gray-light/30 text-blacklist-text px-4 py-3 rounded-lg focus:outline-none focus:border-blacklist-accent-red"
          >
            <option value="rating">Highest Rated</option>
            <option value="distance">Nearest</option>
            <option value="reviews">Most Reviewed</option>
          </select>
        </div>

        {/* Dispensaries Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sortedDispensaries.map((dispensary, index) => (
            <motion.div
              key={dispensary.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/dispensaries/${dispensary.id}`}>
                <div className="card-elevated p-6 rounded-lg hover:accent-glow transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-4">
                      <span className="text-4xl">{dispensary.image}</span>
                      <div>
                        <h3 className="text-lg font-bold text-blacklist-text hover:text-blacklist-accent-red transition-colors">
                          {dispensary.name}
                        </h3>
                        <p className="text-muted text-sm">{dispensary.location}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      dispensary.hours === 'Open now'
                        ? 'bg-blacklist-green-bright/20 text-blacklist-green-bright'
                        : 'bg-blacklist-accent-red/20 text-blacklist-accent-red'
                    }`}>
                      {dispensary.hours}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <span className="text-blacklist-accent-yellow">★</span>
                      <span className="font-bold">{dispensary.rating}</span>
                      <span className="text-muted text-sm">({dispensary.reviews})</span>
                    </div>
                    <span className="text-muted text-sm">{dispensary.distance}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {dispensary.specialties.map((specialty) => (
                      <span key={specialty} className="badge text-xs">
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* No Results */}
        {sortedDispensaries.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted text-lg mb-4">No dispensaries found matching your search.</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSortBy('rating')
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