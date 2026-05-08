'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { motion } from 'framer-motion'

const productForums = [
  {
    id: 'sativa-blend',
    name: 'Sativa Blend',
    posts: 456,
    users: 234,
    lastPost: '2 hours ago',
    description: 'Energetic and uplifting strains',
    members: 1200,
    icon: '⚡'
  },
  {
    id: 'indica-reserve',
    name: 'Indica Reserve',
    posts: 523,
    users: 298,
    lastPost: '1 hour ago',
    description: 'Relaxing and calming experiences',
    members: 1450,
    icon: '🌙'
  },
  {
    id: 'hybrid-gold',
    name: 'Hybrid Gold',
    posts: 389,
    users: 187,
    lastPost: '30 minutes ago',
    description: 'Balanced effects and versatility',
    members: 982,
    icon: '⭐'
  },
  {
    id: 'premium-concentrate',
    name: 'Premium Concentrate',
    posts: 267,
    users: 145,
    lastPost: '4 hours ago',
    description: 'Potent extraction discussions',
    members: 654,
    icon: '💎'
  },
  {
    id: 'infused-edibles',
    name: 'Infused Edibles',
    posts: 398,
    users: 201,
    lastPost: '3 hours ago',
    description: 'Recipes, dosing, and experiences',
    members: 876,
    icon: '🍰'
  },
  {
    id: 'terpene-tincture',
    name: 'Terpene Tincture',
    posts: 234,
    users: 112,
    lastPost: '6 hours ago',
    description: 'Terpene profiles and effects',
    members: 456,
    icon: '🧪'
  }
]

export function ProductForums() {
  const { data: forums } = useQuery({
    queryKey: ['product-forums'],
    queryFn: async () => productForums
  })

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <h2 className="heading-lg mb-12">Product Communities</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forums?.map((forum, index) => (
            <motion.div
              key={forum.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              className="group"
            >
              <Link href={`/products/${forum.id}/forum`}>
                <div className="card-elevated p-6 h-full hover:accent-glow transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{forum.icon}</span>
                      <div>
                        <h3 className="text-lg font-bold text-blacklist-text group-hover:text-blacklist-accent-red transition-colors">
                          {forum.name}
                        </h3>
                        <p className="text-sm text-muted">{forum.members} members</p>
                      </div>
                    </div>
                  </div>

                  <p className="text-muted text-sm mb-4">{forum.description}</p>

                  <div className="grid grid-cols-3 gap-4 mb-4 py-4 border-y border-blacklist-gray-light/30">
                    <div className="text-center">
                      <div className="font-bold text-blacklist-accent-yellow">{forum.posts}</div>
                      <div className="text-xs text-muted">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-blacklist-green-bright">{forum.users}</div>
                      <div className="text-xs text-muted">Active Users</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-blacklist-accent-red">●</div>
                      <div className="text-xs text-muted">Now</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted">
                    <span>Last post:</span>
                    <span className="text-blacklist-green-bright font-medium">{forum.lastPost}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}