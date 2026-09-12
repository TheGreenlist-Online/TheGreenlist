/**
 * Client display preferences that have no business in the database.
 *
 * These are per-browser, so they live in localStorage and are re-applied to
 * <html> before first paint by ApplyAppearance in the root layout to avoid a
 * flash of the un-dimmed backdrop.
 */

export const CALM_STORAGE_KEY = 'greenlist:calm-background'
export const CALM_CLASS = 'gl-calm'

export function readCalmPreference(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return window.localStorage.getItem(CALM_STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

/**
 * Runs as a blocking inline script in <head>, before the body paints, so it
 * cannot import anything or rely on React. Kept as a string for that reason.
 */
export const APPEARANCE_BOOT_SCRIPT = `try{if(localStorage.getItem('${CALM_STORAGE_KEY}')==='on'){document.documentElement.classList.add('${CALM_CLASS}')}}catch(e){}`
