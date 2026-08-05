import { createClient } from '@supabase/supabase-js'
import { getSupabaseUrl } from './env'

/**
 * Server-only Supabase client authenticated with the service role key.
 *
 * This client bypasses Row Level Security and must never be imported into
 * client components or exposed to the browser. Use it only from trusted
 * server contexts such as cron jobs, admin-gated API routes, and background
 * automations that need to write to tables (e.g. `news`, `automation_jobs`)
 * without an end-user session.
 */
export function createSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!serviceRoleKey) {
    throw new Error(
      'Missing SUPABASE_SERVICE_ROLE_KEY. Set it in the environment to use the Supabase admin client.',
    )
  }

  return createClient(getSupabaseUrl(), serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
