'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Menu, X, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const navLinks = [
  { href: '/forums',     label: 'Forums' },
  { href: '/businesses', label: 'Businesses' },
  { href: '/news',       label: 'News' },
  { href: '/reports',    label: 'Reports' },
  { href: '/education',  label: 'Education' },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top shimmer line */}
      <div className="glow-border h-px w-full" />

      {/* Main nav bar */}
      <div
        className="w-full"
        style={{
          background: 'rgba(4, 8, 6, 0.88)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(57,255,136,0.10)',
          boxShadow: '0 4px 32px rgba(0,0,0,0.5), 0 1px 0 rgba(57,255,136,0.06)',
        }}
      >
        <div className="container mx-auto flex h-16 items-center gap-4 px-4">

          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group"
            aria-label="The Green List home"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-accent/30 bg-accent/8"
              style={{ boxShadow: '0 0 12px rgba(57,255,136,0.18)' }}
            >
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <span
              className="hidden font-display font-black uppercase tracking-tight text-lg sm:inline-block"
              style={{
                background: 'linear-gradient(120deg, #39ff88 0%, #22c55e 55%, #f0fdf4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 8px rgba(57,255,136,0.35))',
              }}
            >
              The Green List
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1 ml-2" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 rounded text-sm font-medium text-muted-foreground transition-all duration-200 hover:text-accent hover:bg-accent/6"
                style={{ outline: 'none' }}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2">
            {/* Search — desktop inline */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search reports, forums, businesses…"
                className="pl-9 w-[280px] lg:w-[360px] h-9 bg-white/4 border-accent/15 text-sm placeholder:text-muted-foreground/60 focus:border-accent/40 focus:ring-0 transition-colors"
              />
            </div>

            {/* Mobile search toggle */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-muted-foreground hover:text-accent"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle search"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Auth buttons */}
            <div className="hidden sm:flex items-center gap-2">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-accent hover:bg-accent/6 text-sm"
              >
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="text-sm bg-accent text-black font-semibold hover:bg-accent/90 transition-all"
                style={{ boxShadow: '0 0 14px rgba(57,255,136,0.25)' }}
              >
                <Link href="/auth/signup">Join</Link>
              </Button>
            </div>

            {/* Hamburger */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden text-muted-foreground hover:text-accent"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile search bar */}
        {isSearchOpen && (
          <div className="border-t border-accent/10 px-4 py-3 md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search reports, forums, businesses…"
                className="pl-9 w-full bg-white/4 border-accent/15 text-sm"
                autoFocus
              />
            </div>
          </div>
        )}

        {/* Mobile nav menu */}
        {isMenuOpen && (
          <div className="border-t border-accent/10 md:hidden">
            <nav className="flex flex-col px-4 py-3 gap-1" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2.5 rounded text-sm font-medium text-muted-foreground hover:text-accent hover:bg-accent/6 transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-2 pt-3 border-t border-accent/10 mt-1">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="flex-1 border-accent/25 text-foreground hover:border-accent/50"
                >
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="flex-1 bg-accent text-black font-semibold hover:bg-accent/90"
                >
                  <Link href="/auth/signup">Join</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

