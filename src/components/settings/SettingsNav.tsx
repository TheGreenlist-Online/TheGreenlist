'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { id: 'profile', label: 'Public identity' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'security', label: 'Security' },
  { id: 'standing', label: 'Account standing' },
  { id: 'data', label: 'Your data' },
]

/**
 * Sticky in-page nav for the settings sections.
 *
 * Settings is one scrolling page rather than six routes so nothing reloads
 * while you change things, and this keeps the sections reachable. It highlights
 * whichever section is currently in view.
 */
export function SettingsNav() {
  const [active, setActive] = useState(SECTIONS[0].id)

  useEffect(() => {
    const elements = SECTIONS.map((section) => document.getElementById(section.id)).filter(
      (element): element is HTMLElement => Boolean(element),
    )

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]) setActive(visible[0].target.id)
      },
      // Bias the band towards the top of the viewport so the heading you are
      // reading wins rather than whatever is largest on screen.
      { rootMargin: '-25% 0px -60% 0px', threshold: 0 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  return (
    <nav aria-label="Settings sections" className="mb-6 lg:sticky lg:top-28 lg:mb-0">
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {SECTIONS.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              aria-current={active === section.id ? 'true' : undefined}
              className={cn(
                'block rounded-lg px-3 py-2 text-sm transition',
                active === section.id
                  ? 'bg-emerald-300/[.10] font-semibold text-emerald-200'
                  : 'text-zinc-400 hover:bg-white/[.04] hover:text-zinc-200',
              )}
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
