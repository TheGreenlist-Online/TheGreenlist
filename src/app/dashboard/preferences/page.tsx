import { redirect } from 'next/navigation'

/**
 * Dashboard preferences are now part of /settings. The layout and visible-card
 * selectors this page used to offer were never read by the dashboard and were
 * saved to a `dashboard_preferences` table that does not exist in the schema;
 * the real display preference lives in Settings → Appearance.
 */
export default function DashboardPreferencesRedirect() {
  redirect('/settings#appearance')
}
