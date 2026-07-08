'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { SearchBar } from '@/components/SearchBar'
import { Button } from '@/components/ui/button'

const navItems = [
  { label: 'Forums', href: '/forums' },
  { label: 'Businesses', href: '/businesses' },
  { label: 'News', href: '/news' },
  { label: 'Reports', href: '/reports' },
  { label: 'Dashboard', href: '/dashboard' },
]

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="sticky top-[var(--compliance-banner-height)] z-50 border-b border-amber-300/20 bg-[#080e0b]/90 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-4">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="font-display text-2xl text-amber-100">
            The Green List
          </Link>

          <nav className="hidden items-center gap-5 text-sm font-medium text-zinc-200 lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-emerald-300">
                {item.label}
              </Link>
            ))}
            <Button asChild size="sm">
              <Link href="/auth/signin">Sign in</Link>
            </Button>
          </nav>

          <button
            type="button"
            className="rounded-lg border border-amber-300/30 p-2 text-amber-100 lg:hidden"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <SearchBar className="mt-4" />

        {isOpen ? (
          <nav className="mt-4 grid gap-2 rounded-xl border border-amber-300/20 bg-[#0f1512] p-4 text-sm lg:hidden">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="rounded-md px-2 py-1 text-zinc-200 transition hover:bg-emerald-300/10 hover:text-emerald-200">
                {item.label}
              </Link>
            ))}
            <Link href="/auth/signin" className="rounded-md border border-emerald-300/35 px-2 py-1 text-emerald-200">
              Sign in
            </Link>
          </nav>
        ) : null}
      </div>
    </header>
  )
}
