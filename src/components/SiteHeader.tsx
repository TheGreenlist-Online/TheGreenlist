'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { LogOut, Menu, X } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { GlobalSearch } from '@/components/shell/GlobalSearch'
import { UtilityNav } from '@/components/shell/UtilityNav'
import { DisclosureBar } from '@/components/shell/DisclosureBar'
import {
  ACCOUNT_NAV,
  GOVERNANCE_LINKS,
  PRIMARY_NAV,
  SUBMIT_EVIDENCE,
  activeHref,
} from '@/config/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

/**
 * The one header used on every route.
 *
 * Structure, top to bottom: governance utility line, wordmark + global search
 * + account controls, primary navigation, scope disclosure. Nothing here is
 * decorative; every element states what the platform is, what it holds, or
 * how to act on the record.
 */
export function SiteHeader() {
  const router = useRouter()
  const pathname = usePathname() ?? '/'
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [isOpen, setIsOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const currentSection = activeHref(pathname, PRIMARY_NAV)

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
    <>
      <UtilityNav />

      <header className="gl-header">
        <div className="gl-container gl-header__inner">
          <div className="gl-header__row">
            <Link href="/" className="gl-wordmark" aria-label="The Green List home">
              <span className="gl-wordmark__name">
                The <em>Green</em> List
              </span>
              <span className="gl-wordmark__desc">Independent cannabis records</span>
              <span className="gl-wordmark__rule" aria-hidden="true" />
            </Link>

            <button
              type="button"
              className="gl-menu-button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-expanded={isOpen}
              aria-controls="mobile-navigation"
              aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>

          <GlobalSearch />

          <div className="gl-header__account">
            {isAuthenticated ? (
              <>
                {ACCOUNT_NAV.map((item) => (
                  <Link key={item.href} href={item.href} className="greenlist-quiet-button">
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  className="greenlist-quiet-button"
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {isSigningOut ? 'Signing out' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="greenlist-quiet-button">
                  Sign in
                </Link>
                <Link href="/auth/register" className="greenlist-secondary-button">
                  Request access
                </Link>
              </>
            )}
          </div>
        </div>

        {isOpen ? (
          <nav
            id="mobile-navigation"
            className="gl-container gl-mobile-nav"
            aria-label="Site"
            // Close the menu when any link inside it is followed.
            onClick={(event) => {
              if ((event.target as HTMLElement).closest('a')) setIsOpen(false)
            }}
          >
            {PRIMARY_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={currentSection === item.href ? 'page' : undefined}
              >
                {item.label}
              </Link>
            ))}

            <p className="gl-mobile-nav__group">Governance</p>
            {GOVERNANCE_LINKS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
            <Link href={SUBMIT_EVIDENCE.href}>{SUBMIT_EVIDENCE.label}</Link>

            <p className="gl-mobile-nav__group">Account</p>
            {isAuthenticated ? (
              <>
                {ACCOUNT_NAV.map((item) => (
                  <Link key={item.href} href={item.href}>
                    {item.label}
                  </Link>
                ))}
                <button type="button" onClick={handleSignOut} disabled={isSigningOut}>
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  {isSigningOut ? 'Signing out' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/signin">Sign in</Link>
                <Link href="/auth/register">Request access</Link>
              </>
            )}
          </nav>
        ) : null}
      </header>

      <nav className="gl-nav" aria-label="Primary">
        <ul className="gl-container gl-nav__list">
          {PRIMARY_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="gl-nav__link"
                aria-current={currentSection === item.href ? 'page' : undefined}
                title={item.purpose}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <DisclosureBar />
    </>
  )
}
