import { redirect } from 'next/navigation'

/**
 * Settings used to live in two places: this page (profile + privacy) and
 * /dashboard/preferences (layout + theme + visible cards, none of which
 * anything read). Both are now one authenticated page at /settings, so this
 * route only forwards — old links and bookmarks keep working.
 */
export default function DashboardSettingsRedirect() {
  redirect('/settings')
}
