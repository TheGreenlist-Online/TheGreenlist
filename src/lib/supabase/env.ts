function cleanEnv(value: string | undefined) {
  return value?.trim() ?? ''
}

export function getSupabaseUrl() {
  const supabaseUrl = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_URL)

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL for Supabase Auth.')
  }

  return supabaseUrl
}

export function getSupabasePublishableKey() {
  const publishableKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
  const anonKey = cleanEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  const key = publishableKey || anonKey

  if (!key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY for Supabase Auth.'
    )
  }

  return key
}

export function getSiteUrl() {
  const explicitSiteUrl = cleanEnv(process.env.NEXT_PUBLIC_SITE_URL)
  const appUrl = cleanEnv(process.env.NEXT_PUBLIC_APP_URL)
  const vercelUrl = cleanEnv(process.env.VERCEL_URL)

  if (explicitSiteUrl) {
    return explicitSiteUrl.replace(/\/$/, '')
  }

  if (appUrl) {
    return appUrl.replace(/\/$/, '')
  }

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, '')}`
  }

  return 'http://localhost:3000'
}

export function getAuthRedirectUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${getSiteUrl()}${normalizedPath}`
}
