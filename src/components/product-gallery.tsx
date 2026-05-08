'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const products = [
  {
    id: 1,
    name: 'Sativa Blend',
    category: 'Flower',
    image: 'https://via.placeholder.com/300x400?text=Sativa+Blend',
    rating: 4.8,
    reviews: 234,
    slug: 'sativa-blend'
  },
  {
    id: 2,
    name: 'Indica Reserve',
    category: 'Flower',
    image: 'https://via.placeholder.com/300x400?text=Indica+Reserve',
    rating: 4.9,
    reviews: 312,
    slug: 'indica-reserve'
  },
  {
    id: 3,
    name: 'Hybrid Gold',
    category: 'Flower',
    image: 'https://via.placeholder.com/300x400?text=Hybrid+Gold',
    rating: 4.7,
    reviews: 189,
    slug: 'hybrid-gold'
  },
  {
    id: 4,
    name: 'Premium Concentrate',
    category: 'Concentrates',
    image: 'https://via.placeholder.com/300x400?text=Premium+Concentrate',
    rating: 4.6,
    reviews: 156,
    slug: 'premium-concentrate'
  },
  {
    id: 5,
    name: 'Infused Edibles',
    category: 'Edibles',
    image: 'https://via.placeholder.com/300x400?text=Infused+Edibles',
    rating: 4.5,
    reviews: 198,
    slug: 'infused-edibles'
  },
  {
    id: 6,
    name: 'Terpene Tincture',
    category: 'Tinctures',
    image: 'https://via.placeholder.com/300x400?text=Terpene+Tincture',
    rating: 4.8,
    reviews: 142,
    slug: 'terpene-tincture'
  }
]

export function ProductGallery() {
  const [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % products.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const getPosition = (index: number) => {
    let position = index - current
    if (position < -1) position += products.length
    if (position > 2) position -= products.length
    return position
  }

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + products.length) % products.length)
    setDirection(-1)
  }

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % products.length)
    setDirection(1)
  }

  return (
    <section className="py-16 px-4 bg-blacklist-gray/30">
      <div className="container mx-auto">
        <h2 className="heading-lg text-center mb-12">Featured Products</h2>

        <div className="relative h-96 flex items-center justify-center">
          {/* Product Display Area */}
          <div className="relative w-full max-w-5xl h-full flex items-center justify-center">
            {/* Left Navigation */}
            <button
              onClick={handlePrev}
              className="absolute left-0 z-20 p-3 rounded-full bg-blacklist-accent-red/20 hover:bg-blacklist-accent-red/40 transition-colors duration-300 ml-4"
            >
              <svg className="w-6 h-6 text-blacklist-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Product Cards Carousel */}
            <div className="flex justify-center items-center w-full h-full gap-4 px-20">
              {products.map((product, index) => {
                const position = getPosition(index)
                if (position < -1 || position > 2) return null

                return (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
                    animate={{
                      opacity: position === 0 ? 1 : 0.5,
                      x: position * 150,
                      scale: position === 0 ? 1 : 0.85,
                      zIndex: position === 0 ? 20 : 10 - Math.abs(position),
                    }}
                    transition={{ duration: 0.5 }}
                    className="absolute"
                  >
                    <Link href={`/products/${product.slug}`}>
                      <div
                        className={`cursor-pointer transition-all duration-300 ${
                          position === 0 ? 'card-elevated accent-glow' : 'card-elevated'
                        } overflow-hidden`}
                      >
                        <div className="relative h-64 w-48 bg-blacklist-gray">
                          <Image
                            src={product.image}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="p-4">
                          <span className="badge text-xs">{product.category}</span>
                          <h3 className="font-bold text-blacklist-text mt-2">{product.name}</h3>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <span className="text-blacklist-accent-yellow">★</span>
                              <span className="text-sm font-medium">{product.rating}</span>
                              <span className="text-xs text-muted">({product.reviews})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>

            {/* Right Navigation */}
            <button
              onClick={handleNext}
              className="absolute right-0 z-20 p-3 rounded-full bg-blacklist-accent-red/20 hover:bg-blacklist-accent-red/40 transition-colors duration-300 mr-4"
            >
              <svg className="w-6 h-6 text-blacklist-accent-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Indicator Dots */}
        <div className="flex justify-center gap-2 mt-8">
          {products.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === current
                  ? 'bg-blacklist-accent-red w-8'
                  : 'bg-blacklist-gray-light hover:bg-blacklist-green-bright'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}