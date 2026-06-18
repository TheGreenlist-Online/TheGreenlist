'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32 smoke-surface">
      <div className="absolute inset-x-0 top-0 h-px glow-border opacity-70" />
      <div className="container relative mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 text-sm font-semibold uppercase tracking-[0.24em] text-accent"
          >
            Cannabis transparency and accountability
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl"
          >
            The Green{' '}
            <span className="bg-gradient-to-r from-accent via-primary to-foreground bg-clip-text text-transparent">
              List
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl"
          >
            The Green List is a cannabis transparency and accountability platform for reports, forums, news, and community trust. No marketplace, no ordering, no dispensary transactions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Button asChild size="lg">
              <Link href="/forums">Explore Forums</Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/reports">View Reports</Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-3"
          >
            {[
              ['Community', 'Education and reporting'],
              ['Sources', 'Context over rumor'],
              ['Trust', 'Accountability first'],
            ].map(([label, body]) => (
              <div key={label} className="glow-border rounded-lg p-px">
                <div className="rounded-lg bg-card/80 p-5 backdrop-blur">
                  <div className="text-2xl font-bold text-accent">{label}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{body}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
