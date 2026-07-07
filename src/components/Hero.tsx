'use client'

import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Shield, ChevronRight } from 'lucide-react'

/* ─── Decorative SVG: filigree corner ornament ────────────── */
function FiligreeCorner({
  flip = false,
  flipY = false,
}: {
  flip?: boolean
  flipY?: boolean
}) {
  return (
    <svg
      width="110"
      height="110"
      viewBox="0 0 110 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform: `scale(${flip ? -1 : 1}, ${flipY ? -1 : 1})`,
        transformOrigin: 'center',
      }}
      aria-hidden="true"
    >
      {/* Outer L-bracket */}
      <path d="M2 2 L2 80" stroke="#39ff88" strokeWidth="1.5" opacity="0.65" />
      <path d="M2 2 L80 2" stroke="#39ff88" strokeWidth="1.5" opacity="0.65" />
      {/* Inner echo lines */}
      <path d="M9 9 L9 60" stroke="#39ff88" strokeWidth="0.6" opacity="0.22" />
      <path d="M9 9 L60 9" stroke="#39ff88" strokeWidth="0.6" opacity="0.22" />
      {/* Tick marks on vertical */}
      <line x1="2" y1="22" x2="16" y2="22" stroke="#39ff88" strokeWidth="1.1" opacity="0.55" />
      <line x1="2" y1="38" x2="12" y2="38" stroke="#39ff88" strokeWidth="1"   opacity="0.38" />
      <line x1="2" y1="55" x2="9"  y2="55" stroke="#39ff88" strokeWidth="0.8" opacity="0.25" />
      <line x1="2" y1="70" x2="7"  y2="70" stroke="#39ff88" strokeWidth="0.7" opacity="0.18" />
      {/* Tick marks on horizontal */}
      <line x1="22" y1="2" x2="22" y2="16" stroke="#39ff88" strokeWidth="1.1" opacity="0.55" />
      <line x1="38" y1="2" x2="38" y2="12" stroke="#39ff88" strokeWidth="1"   opacity="0.38" />
      <line x1="55" y1="2" x2="55" y2="9"  stroke="#39ff88" strokeWidth="0.8" opacity="0.25" />
      <line x1="70" y1="2" x2="70" y2="7"  stroke="#39ff88" strokeWidth="0.7" opacity="0.18" />
      {/* Corner diamond */}
      <polygon points="2,0 5,3 2,6 -1,3" fill="#39ff88" opacity="0.9" />
      {/* Small dot accents */}
      <circle cx="2"  cy="80" r="2.2" fill="#39ff88" opacity="0.35" />
      <circle cx="80" cy="2"  r="2.2" fill="#39ff88" opacity="0.35" />
      <circle cx="2"  cy="55" r="1.2" fill="#39ff88" opacity="0.25" />
      <circle cx="55" cy="2"  r="1.2" fill="#39ff88" opacity="0.25" />
      {/* Arc flourish */}
      <path
        d="M22 2 Q22 22 2 22"
        stroke="#39ff88" strokeWidth="0.8" fill="none" opacity="0.3"
      />
    </svg>
  )
}

/* ─── Decorative SVG: abstract leaf silhouette ────────────── */
function LeafSilhouette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Stylised fan-leaf shape — original abstract botanical */}
      <path
        d="M110 250 C110 250 108 200 80 180 C40 155 8 160 2 130 C-4 100 30 80 60 90
           C40 65 20 30 50 10 C70 -3 90 15 100 40
           C95 15 100 -5 110 5
           C120 -5 125 15 120 40
           C130 15 150 -3 170 10
           C200 30 180 65 160 90
           C190 80 224 100 218 130
           C212 160 180 155 140 180
           C112 200 110 250 110 250 Z"
        fill="#39ff88"
        opacity="0.04"
      />
      {/* Central vein */}
      <line x1="110" y1="248" x2="110" y2="18" stroke="#39ff88" strokeWidth="0.8" opacity="0.12" />
      {/* Side veins */}
      <line x1="110" y1="180" x2="72"  y2="145" stroke="#39ff88" strokeWidth="0.6" opacity="0.08" />
      <line x1="110" y1="180" x2="148" y2="145" stroke="#39ff88" strokeWidth="0.6" opacity="0.08" />
      <line x1="110" y1="140" x2="58"  y2="108" stroke="#39ff88" strokeWidth="0.5" opacity="0.07" />
      <line x1="110" y1="140" x2="162" y2="108" stroke="#39ff88" strokeWidth="0.5" opacity="0.07" />
    </svg>
  )
}

/* ─── Decorative SVG: motion speed lines ─────────────────── */
function SpeedLines({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {[
        { x1: 0, y1: 40,  x2: 600, y2: 38,  o: 0.06 },
        { x1: 0, y1: 80,  x2: 600, y2: 76,  o: 0.04 },
        { x1: 0, y1: 130, x2: 600, y2: 124, o: 0.05 },
        { x1: 0, y1: 180, x2: 600, y2: 173, o: 0.03 },
        { x1: 0, y1: 220, x2: 600, y2: 212, o: 0.04 },
        { x1: 0, y1: 260, x2: 600, y2: 252, o: 0.03 },
      ].map((l, i) => (
        <line
          key={i}
          x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
          stroke="#39ff88"
          strokeWidth="1"
          opacity={l.o}
        />
      ))}
    </svg>
  )
}

/* ─── Smoke wisps ─────────────────────────────────────────── */
function SmokeWisps({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M50 280 C60 240 30 220 50 180 C70 140 40 120 60 80 C80 40 110 30 100 0"
        stroke="#39ff88" strokeWidth="1.2" opacity="0.12" fill="none"
        strokeLinecap="round"
      />
      <path
        d="M130 300 C145 260 110 240 130 195 C150 150 120 130 145 88 C170 46 200 38 190 0"
        stroke="#39ff88" strokeWidth="0.9" opacity="0.09" fill="none"
        strokeLinecap="round"
      />
      <path
        d="M230 290 C248 248 215 230 238 185 C260 140 230 125 255 80 C280 35 310 28 300 0"
        stroke="#39ff88" strokeWidth="0.7" opacity="0.07" fill="none"
        strokeLinecap="round"
      />
    </svg>
  )
}

/* ─── Shield badge mark ───────────────────────────────────── */
function ShieldBadge() {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/25 bg-accent/5 text-accent text-xs font-semibold uppercase tracking-[0.2em]">
      <Shield className="h-3.5 w-3.5" />
      Verified Trust Platform
    </div>
  )
}

/* ─── Stat card ───────────────────────────────────────────── */
function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass-card rounded-lg p-4 text-center">
      <div className="text-2xl font-black font-display text-accent mb-0.5">{value}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  )
}

/* ─── Hero ────────────────────────────────────────────────── */
export function Hero() {
  return (
    <section className="relative overflow-hidden hero-bg min-h-[88vh] flex items-center">
      {/* Grunge noise overlay */}
      <div className="absolute inset-0 grunge-overlay opacity-60 pointer-events-none" />

      {/* Animated shimmer radial — center glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] pointer-events-none shimmer-radial"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(57,255,136,0.09), transparent)',
        }}
      />

      {/* Large background leaf silhouette */}
      <LeafSilhouette className="absolute right-[-4%] top-[5%] w-[320px] opacity-100 pointer-events-none select-none" />
      <LeafSilhouette className="absolute left-[-6%] bottom-[5%] w-[240px] opacity-60 pointer-events-none select-none rotate-[15deg]" />

      {/* Smoke wisps */}
      <SmokeWisps className="absolute left-[8%] top-0 h-full w-[280px] smoke-drift pointer-events-none" />
      <SmokeWisps className="absolute right-[12%] top-0 h-full w-[220px] smoke-drift pointer-events-none [animation-delay:4s] scale-x-[-1]" />

      {/* Speed lines */}
      <SpeedLines className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Top glow line */}
      <div className="absolute inset-x-0 top-0 h-px glow-border opacity-80" />
      {/* Bottom glow line */}
      <div className="absolute inset-x-0 bottom-0 h-px glow-border opacity-40" />

      {/* Filigree corners */}
      <div className="absolute top-4 left-4 pointer-events-none select-none">
        <FiligreeCorner />
      </div>
      <div className="absolute top-4 right-4 pointer-events-none select-none">
        <FiligreeCorner flip />
      </div>
      <div className="absolute bottom-4 left-4 pointer-events-none select-none">
        <FiligreeCorner flipY />
      </div>
      <div className="absolute bottom-4 right-4 pointer-events-none select-none">
        <FiligreeCorner flip flipY />
      </div>

      {/* ── Content ── */}
      <div className="container relative mx-auto px-4 py-20 sm:py-28 z-10">
        <div className="mx-auto max-w-5xl text-center">

          {/* Label */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex justify-center"
          >
            <ShieldBadge />
          </motion.div>

          {/* Main headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65 }}
            className="font-display text-[clamp(3.5rem,11vw,8.5rem)] font-black uppercase leading-tight tracking-tight text-foreground"
          >
            THE{' '}
            <span className="neon-text relative inline-block">
              GREEN
              <span className="absolute -inset-x-2 bottom-0 h-[3px] bg-gradient-to-r from-transparent via-accent to-transparent opacity-60" />
            </span>
            <br />
            <span className="text-[clamp(3rem,9vw,7rem)]">LIST</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-smoke-100 sm:text-xl"
          >
            Cannabis transparency, community accountability, and verified trust —
            built for the people, not the marketplace.
          </motion.p>

          {/* Supporting compliance line */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mx-auto mt-4 max-w-xl text-xs sm:text-sm font-semibold uppercase tracking-[0.18em] text-accent/60"
          >
            Reports · Forums · Education · Evidence · Moderation
            <span className="mx-2 text-muted-foreground/40">|</span>
            No Sales · No Checkout · No Transactions
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.44 }}
            className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap"
          >
            <Button
              asChild
              size="lg"
              className="btn-glow min-w-[160px] bg-accent text-black font-bold hover:bg-accent/90"
            >
              <Link href="/reports" className="inline-flex items-center gap-2">
                Explore Reports <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="btn-glow min-w-[160px] border-accent/35 text-foreground hover:border-accent/70 hover:text-accent"
            >
              <Link href="/forums">Join the Forums</Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="min-w-[160px] text-muted-foreground hover:text-accent hover:bg-accent/5"
            >
              <Link href="/education">Learn How It Works</Link>
            </Button>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            <StatCard value="12K+" label="Community Reports" />
            <StatCard value="3.4K" label="Verified Businesses" />
            <StatCard value="89K+" label="Forum Posts" />
            <StatCard value="47K" label="Members" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

