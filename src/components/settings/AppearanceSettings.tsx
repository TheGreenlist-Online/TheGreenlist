'use client'

import { useEffect, useState } from 'react'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { Toggle } from '@/components/settings/SettingsControls'
import { CALM_CLASS, CALM_STORAGE_KEY, readCalmPreference } from '@/lib/appearance'

/**
 * Appearance controls that actually change the page.
 *
 * This replaces the old preferences page's theme picker, which offered
 * "dark-green / high-contrast / low-glow" and a layout selector that nothing in
 * the app ever read — the values were written to a `dashboard_preferences`
 * table that does not exist, fell back to localStorage, and then reported
 * success. Calm mode below is applied to <html> immediately and re-applied
 * before first paint by the script in the root layout.
 */
export function AppearanceSettings() {
  const [calm, setCalm] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setCalm(readCalmPreference())
    setIsReady(true)
  }, [])

  const update = (next: boolean) => {
    setCalm(next)
    document.documentElement.classList.toggle(CALM_CLASS, next)
    try {
      window.localStorage.setItem(CALM_STORAGE_KEY, next ? 'on' : 'off')
    } catch {
      // Private browsing can refuse storage; the class still applies for this visit.
    }
  }

  return (
    <SettingsSection
      id="appearance"
      title="Appearance"
      description="Display preferences for this browser. They apply immediately and are remembered on this device."
    >
      <Toggle
        id="calm-mode"
        label="Calm background"
        description="Dims the smoke backdrop and removes panel lift and glow. Easier to read for long stretches, and gentler on low-contrast screens."
        checked={calm}
        onChange={update}
        disabled={!isReady}
      />

      <p className="text-xs leading-5 text-zinc-500">
        If your operating system is set to reduce motion, the site already honours that automatically.
      </p>
    </SettingsSection>
  )
}
