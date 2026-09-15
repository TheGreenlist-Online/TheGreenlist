'use client'

import { useSyncExternalStore } from 'react'
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
const APPEARANCE_CHANGE_EVENT = 'greenlist:appearance-change'

function subscribeToCalmPreference(onStoreChange: () => void) {
  window.addEventListener('storage', onStoreChange)
  window.addEventListener(APPEARANCE_CHANGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener('storage', onStoreChange)
    window.removeEventListener(APPEARANCE_CHANGE_EVENT, onStoreChange)
  }
}

export function AppearanceSettings() {
  const calm = useSyncExternalStore(subscribeToCalmPreference, readCalmPreference, () => false)

  const update = (next: boolean) => {
    document.documentElement.classList.toggle(CALM_CLASS, next)
    try {
      window.localStorage.setItem(CALM_STORAGE_KEY, next ? 'on' : 'off')
      window.dispatchEvent(new Event(APPEARANCE_CHANGE_EVENT))
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
      />

      <p className="text-xs leading-5 text-zinc-500">
        If your operating system is set to reduce motion, the site already honours that automatically.
      </p>
    </SettingsSection>
  )
}
