'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  FileText,
  ShieldCheck,
  BookOpen,
  MessageSquare,
  Paperclip,
  Eye,
} from 'lucide-react'

interface FeatureCard {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  accentColor: string
}

const features: FeatureCard[] = [
  {
    icon: <FileText className="h-6 w-6" />,
    title: 'Community Reports',
    description:
      'Submit and browse transparency reports on cannabis businesses, products, and practices. Evidence-backed accountability.',
    href: '/reports',
    accentColor: 'rgba(57,255,136,0.75)',
  },
  {
    icon: <ShieldCheck className="h-6 w-6" />,
    title: 'Verified Businesses',
    description:
      'Find cannabis businesses vetted through our trust verification process. Transparency scores, not star ratings.',
    href: '/businesses',
    accentColor: 'rgba(34,197,94,0.8)',
  },
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: 'Cannabis Education',
    description:
      'Guides, legal resources, and harm-reduction content written for real people — not dispensary marketing.',
    href: '/education',
    accentColor: 'rgba(74,222,128,0.75)',
  },
  {
    icon: <MessageSquare className="h-6 w-6" />,
    title: 'Forums & Discussion',
    description:
      'Open community forums for cultivation, consumer safety, worker rights, legal aid, and cannabis culture.',
    href: '/forums',
    accentColor: 'rgba(57,255,136,0.7)',
  },
  {
    icon: <Paperclip className="h-6 w-6" />,
    title: 'Evidence Submission',
    description:
      'Securely submit documentation, photos, and whistleblower reports. Metadata-scrubbed and privacy-protected.',
    href: '/evidence',
    accentColor: 'rgba(250,204,21,0.7)',
  },
  {
    icon: <Eye className="h-6 w-6" />,
    title: 'Moderator Review',
    description:
      'Human-reviewed moderation queues, transparent decision logs, and a due-process appeals workflow.',
    href: '/reports',
    accentColor: 'rgba(249,115,22,0.7)',
  },
]

export function FeatureCards() {
  return (
    <section className="py-16">
      <div className="mb-10 text-center">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.28em] text-accent/70">
          What We Do
        </p>
        <h2 className="font-display text-3xl font-black uppercase tracking-tight text-foreground sm:text-4xl">
          Platform Features
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          A full-stack transparency and accountability toolkit built for the cannabis community — zero commerce, zero checkout.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: index * 0.08 }}
          >
            <Link href={feature.href} className="block h-full">
              <div className="glass-card group h-full rounded-lg p-6">
                {/* Icon */}
                <div
                  className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-md border"
                  style={{
                    color: feature.accentColor,
                    borderColor: feature.accentColor.replace(')', ', 0.3)').replace('rgba(', 'rgba('),
                    background: feature.accentColor.replace('0.7', '0.07').replace('0.75', '0.07').replace('0.8', '0.07'),
                    boxShadow: `0 0 16px ${feature.accentColor.replace('0.7', '0.15').replace('0.75', '0.15').replace('0.8', '0.15')}`,
                  }}
                >
                  {feature.icon}
                </div>

                {/* Title */}
                <h3
                  className="mb-2 text-base font-bold text-foreground transition-colors group-hover:text-accent"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>

                {/* Bottom accent line */}
                <div
                  className="mt-5 h-px w-0 transition-all duration-300 group-hover:w-full"
                  style={{
                    background: `linear-gradient(90deg, ${feature.accentColor}, transparent)`,
                  }}
                />
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
