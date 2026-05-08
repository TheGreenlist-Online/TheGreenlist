'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState } from 'react'

const productData: Record<string, any> = {
  'sativa-blend': {
    name: 'Sativa Blend',
    category: 'Flower',
    image: 'https://via.placeholder.com/500x600?text=Sativa+Blend',
    rating: 4.8,
    reviews: 234,
    thc: '18-22%',
    cbd: '0.5-1%',
    effects: ['Energetic', 'Creative', 'Uplifting'],
    flavor: ['Citrus', 'Piney', 'Herbal'],
    cultivator: 'Green Valley Farms',
    description: 'A carefully crafted sativa blend known for its energetic and creative effects. Perfect for daytime use.',
    reviews_list: [
      {
        author: 'User123',
        rating: 5,
        text: 'Amazing strain! Great for productivity',
        date: '2 days ago'
      },
      {
        author: 'CannabisEnthusiast',
        rating: 5,
        text: 'Clean taste and smooth smoke',
        date: '1 week ago'
      }
    ]
  },
  'indica-reserve': {
    name: 'Indica Reserve',
    category: 'Flower',
    image: 'https://via.placeholder.com/500x600?text=Indica+Reserve',
    rating: 4.9,
    reviews: 312,
    thc: '20-24%',
    cbd: '0.2-0.8%',
    effects: ['Relaxing', 'Sleepy', 'Calming'],
    flavor: ['Berry', 'Woody', 'Sweet'],
    cultivator: 'Mountain Peak Growers',
    description: 'Premium indica strain perfect for evening relaxation and rest.',
    reviews_list: [
      {
        author: 'NightOwl',
        rating: 5,
        text: 'Best sleep I have had in months!',
        date: '3 days ago'
      }
    ]
  }
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const product = productData[params.slug] || productData['sativa-blend']
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="min-h-screen bg-blacklist-dark">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 py-4">
        <Link href="/products" className="text-muted hover:text-blacklist-green-bright">
          ← Back to Products
        </Link>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card-elevated p-6 rounded-lg"
          >
            <div className="relative h-96 bg-blacklist-gray rounded-lg overflow-hidden">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="mt-6 space-y-3">
              <button className="btn-primary w-full">
                Write a Review
              </button>
              <button className="btn-secondary w-full">
                Save Product
              </button>
            </div>
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="space-y-6">
              {/* Header */}
              <div>
                <span className="badge mb-3">{product.category}</span>
                <h1 className="heading-lg mb-4">{product.name}</h1>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl text-blacklist-accent-yellow">★</span>
                    <span className="text-2xl font-bold">{product.rating}</span>
                  </div>
                  <div className="text-muted">
                    <span className="text-xl">{product.reviews}</span> reviews
                  </div>
                </div>
              </div>

              {/* Key Stats */}
              <div className="card-elevated p-6 rounded-lg">
                <h3 className="font-bold text-blacklist-text mb-4">Cannabinoid Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-blacklist-accent-red font-bold text-2xl">{product.thc}</span>
                    <p className="text-muted text-sm">THC</p>
                  </div>
                  <div>
                    <span className="text-blacklist-green-bright font-bold text-2xl">{product.cbd}</span>
                    <p className="text-muted text-sm">CBD</p>
                  </div>
                </div>
              </div>

              {/* Effects & Flavors */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-blacklist-text mb-3">Effects</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.effects.map((effect: string) => (
                      <span key={effect} className="badge">{effect}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-bold text-blacklist-text mb-3">Flavor Profile</h4>
                  <div className="flex flex-wrap gap-2">
                    {product.flavor.map((flavor: string) => (
                      <span key={flavor} className="badge-yellow">{flavor}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cultivator */}
              <div className="card-elevated p-6 rounded-lg">
                <h4 className="font-bold text-blacklist-text mb-2">Cultivator</h4>
                <p className="text-blacklist-text mb-4">{product.cultivator}</p>
                <Link href={`/cultivator/${product.cultivator.toLowerCase().replace(/\s+/g, '-')}`} className="btn-secondary text-sm">
                  View Cultivator
                </Link>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex gap-6 border-b border-blacklist-gray-light/30 mb-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-4 font-semibold transition-colors ${
                activeTab === 'overview'
                  ? 'border-b-2 border-blacklist-accent-red text-blacklist-accent-red'
                  : 'text-muted hover:text-blacklist-text'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`pb-4 font-semibold transition-colors ${
                activeTab === 'reviews'
                  ? 'border-b-2 border-blacklist-accent-red text-blacklist-accent-red'
                  : 'text-muted hover:text-blacklist-text'
              }`}
            >
              Reviews ({product.reviews})
            </button>
            <button
              onClick={() => setActiveTab('forum')}
              className={`pb-4 font-semibold transition-colors ${
                activeTab === 'forum'
                  ? 'border-b-2 border-blacklist-accent-red text-blacklist-accent-red'
                  : 'text-muted hover:text-blacklist-text'
              }`}
            >
              Community Discussion
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-elevated p-8 rounded-lg"
            >
              <p className="text-blacklist-text text-lg leading-relaxed">{product.description}</p>
            </motion.div>
          )}

          {activeTab === 'reviews' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {product.reviews_list.map((review: any, index: number) => (
                <div key={index} className="card-elevated p-6 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-bold text-blacklist-text">{review.author}</h4>
                      <div className="flex items-center gap-1 text-blacklist-accent-yellow">
                        {'★'.repeat(review.rating)}
                      </div>
                    </div>
                    <span className="text-sm text-muted">{review.date}</span>
                  </div>
                  <p className="text-blacklist-text">{review.text}</p>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'forum' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="card-elevated p-8 rounded-lg text-center"
            >
              <p className="text-muted mb-4">Join the community discussion about {product.name}</p>
              <button className="btn-primary">View Product Forum</button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}