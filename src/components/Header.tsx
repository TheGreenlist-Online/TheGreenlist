'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-accent/20 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="glow-border h-px w-full opacity-70" />
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="hidden bg-gradient-to-r from-accent via-primary to-foreground bg-clip-text text-xl font-bold text-transparent sm:inline-block">
              The Green List
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium text-muted-foreground">
            <Link href="/forums" className="transition-colors hover:text-accent">
              Forums
            </Link>
            <Link href="/businesses" className="transition-colors hover:text-accent">
              Businesses
            </Link>
            <Link href="/news" className="transition-colors hover:text-accent">
              News
            </Link>
            <Link href="/reports" className="transition-colors hover:text-accent">
              Reports
            </Link>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <Link href="/" className="mr-2 flex items-center md:hidden">
            <span className="whitespace-nowrap bg-gradient-to-r from-accent via-primary to-foreground bg-clip-text text-lg font-bold text-transparent">
              The Green List
            </span>
          </Link>

          <div className="hidden w-full flex-1 sm:block md:w-auto md:flex-none">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search forums, businesses, reports..."
                className="pl-8 md:w-[300px] lg:w-[400px]"
              />
            </div>
          </div>

          <nav className="flex items-center space-x-2">
            <Button asChild variant="ghost">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signin">Sign in</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth/signout">Sign out</Link>
            </Button>

            <Button
              variant="ghost"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Open navigation"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </nav>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-accent/20 bg-background/95 md:hidden">
          <nav className="flex flex-col space-y-2 p-4 text-sm text-muted-foreground">
            <Link href="/forums" className="transition-colors hover:text-accent">
              Forums
            </Link>
            <Link href="/businesses" className="transition-colors hover:text-accent">
              Businesses
            </Link>
            <Link href="/news" className="transition-colors hover:text-accent">
              News
            </Link>
            <Link href="/reports" className="transition-colors hover:text-accent">
              Reports
            </Link>
            <Link href="/trending" className="transition-colors hover:text-accent">
              Trending
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
