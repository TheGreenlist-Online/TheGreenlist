'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-secondary/20 py-24 sm:py-32">
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            THEBLACKLIST.
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              ONLINE
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 text-lg leading-8 text-muted-foreground sm:text-xl"
          >
            A cannabis industry transparency network. Public accountability, consumer verification,
            and community-driven oversight for the cannabis marketplace.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex items-center justify-center gap-x-6"
          >
            <Button asChild size="lg">
              <Link href="/forums">
                Explore Forums
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/reports">
                View Reports
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">10K+</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">500+</div>
              <div className="text-sm text-muted-foreground">Verified Businesses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">25K+</div>
              <div className="text-sm text-muted-foreground">Transparency Reports</div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}