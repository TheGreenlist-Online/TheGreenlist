'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Leaf, LogOut, Menu, UserRound, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { SearchBar } from '@/components/SearchBar'
import { Button } from '@/components/ui/button'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const navItems = [
  { label: 'Forums', href: '/forums' },
  { label: 'Businesses', href: '/businesses' },
  { label: 'News', href: '/news' },
  { label: 'Reports', href: '/reports' },
  { label: 'Evidence', href: '/evidence' },
  { label: 'Education', href: '/education' },
  { label: 'Dashboard', href: '/dashboard' },
]

export function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setIsAuthenticated(Boolean(data.session))
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setIsAuthenticated(Boolean(session))
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [supabase])

  async function handleSignOut() {
    setIsSigningOut(true)
    await supabase.auth.signOut()
    setIsAuthenticated(false)
    setIsOpen(false)
    setIsSigningOut(false)
    router.replace('/')
    router.refresh()
  }

  return (
    <header className="site-header sticky top-[var(--compliance-banner-height)] z-50">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="site-brand" aria-label="The Green List home">
            <span className="site-brand__mark"><Leaf /></span>
            <span>The Green List</span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-medium text-zinc-300 lg:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="transition hover:text-emerald-300">
                {item.label}
              </Link>
            ))}
            <Button asChild size="sm" variant="outline">
              <Link href={pathname.startsWith('/town') ? '/' : '/town'}>
                {pathname.startsWith('/town') ? 'Standard View' : 'Town View'}
              </Link>
            </Button>
            {isAuthenticated ? (
              <Button type="button" size="sm" variant="outline" onClick={handleSignOut} disabled={isSigningOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link href="/auth/signin">
                  <UserRound className="mr-2 h-4 w-4" />
                  Sign in
                </Link>
              </Button>
            )}
          </nav>

          <button
            type="button"
            className="rounded-lg border border-white/10 bg-white/[.03] p-2 text-zinc-100 lg:hidden"
            onClick={() => setIsOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        <SearchBar className="mt-3 lg:hidden" />

        {isOpen ? (
          <nav className="mt-3 grid gap-2 rounded-xl border border-white/10 bg-[#0b100d] p-3 text-sm shadow-2xl lg:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className="rounded-md px-2 py-2 text-zinc-200 transition hover:bg-emerald-300/10 hover:text-emerald-200"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={pathname.startsWith('/town') ? '/' : '/town'}
              onClick={() => setIsOpen(false)}
              className="rounded-md border border-emerald-300/35 px-2 py-2 text-emerald-200"
            >
              {pathname.startsWith('/town') ? 'Standard View' : 'Town View'}
            </Link>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="flex items-center rounded-md border border-amber-300/35 px-2 py-2 text-left text-amber-100"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isSigningOut ? 'Signing out...' : 'Sign out'}
              </button>
            ) : (
              <Link
                href="/auth/signin"
                onClick={() => setIsOpen(false)}
                className="rounded-md border border-emerald-300/35 px-2 py-2 text-emerald-200"
              >
                Sign in
              </Link>
            )}
          </nav>
        ) : null}
      </div>
    </header>
  )
}
