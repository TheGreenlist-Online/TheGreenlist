'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Menu, X, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const navLinks = [
  { href: '/forums', label: 'Forums' },
  { href: '/businesses', label: 'Businesses' },
  { href: '/news', label: 'News' },
  { href: '/reports', label: 'Reports' },
  { href: '/education/new', label: 'Education' },
]

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="glow-border h-px w-full" />

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
          <Link href="/" className="group flex shrink-0 items-center gap-2" aria-label="The Green List home">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-sm border border-accent/30 bg-accent/8"
              style={{ boxShadow: '0 0 12px rgba(57,255,136,0.18)' }}
            >
              <Shield className="h-4 w-4 text-accent" />
            </div>
            <span
              className="hidden font-display text-lg font-black uppercase tracking-tight sm:inline-block"
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

          <nav className="ml-2 hidden items-center gap-1 md:flex" aria-label="Main navigation">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded px-3 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-accent/6 hover:text-accent"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reports, forums, businesses…"
                className="h-9 w-[280px] border-accent/15 bg-white/4 pl-9 text-sm placeholder:text-muted-foreground/60 focus:border-accent/40 focus:ring-0 transition-colors lg:w-[360px]"
              />
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-accent md:hidden"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label="Toggle search"
              aria-expanded={isSearchOpen}
            >
              <Search className="h-4 w-4" />
            </Button>

            <div className="hidden items-center gap-2 sm:flex">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="text-sm text-muted-foreground hover:bg-accent/6 hover:text-accent"
              >
                <Link href="/auth/signin">Sign in</Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="bg-accent text-sm font-semibold text-black transition-all hover:bg-accent/90"
                style={{ boxShadow: '0 0 14px rgba(57,255,136,0.25)' }}
              >
                <Link href="/auth/signup">Join</Link>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-accent md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? 'Close navigation' : 'Open navigation'}
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {isSearchOpen && (
          <div className="border-t border-accent/10 px-4 py-3 md:hidden">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search reports, forums, businesses…"
                className="w-full border-accent/15 bg-white/4 pl-9 text-sm"
                autoFocus
              />
            </div>
          </div>
        )}

        {isMenuOpen && (
          <div className="border-t border-accent/10 md:hidden">
            <nav className="flex flex-col gap-1 px-4 py-3" aria-label="Mobile navigation">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/6 hover:text-accent"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-1 flex gap-2 border-t border-accent/10 pt-3">
                <Button asChild variant="outline" size="sm" className="flex-1 border-accent/25 text-foreground hover:border-accent/50">
                  <Link href="/auth/signin">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="flex-1 bg-accent font-semibold text-black hover:bg-accent/90">
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
