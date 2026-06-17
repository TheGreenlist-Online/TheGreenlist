'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getProviders, signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import type { ClientSafeProvider } from 'next-auth/react'

const errorMessages: Record<string, string> = {
  OAuthSignin: 'The provider flow could not start. Check OAuth configuration in Vercel.',
  OAuthCallback: 'The provider callback failed. Check callback URLs and provider secrets.',
  CredentialsSignin: 'Email or password was not accepted.',
  AccessDenied: 'Access denied for this attempt.',
  Configuration: 'Authentication is not fully configured for production.',
}

function safeCallbackUrl(value: string | null) {
  if (!value) return '/dashboard'
  if (value.startsWith('/') && !value.startsWith('//')) return value
  return '/dashboard'
}

export default function SignInPage() {
  const searchParams = useSearchParams()
  const callbackUrl = useMemo(
    () => safeCallbackUrl(searchParams.get('callbackUrl') ?? searchParams.get('next')),
    [searchParams]
  )
  const error = searchParams.get('error')
  const [providers, setProviders] = useState<Record<string, ClientSafeProvider> | null>(null)

  useEffect(() => {
    getProviders().then(setProviders)
  }, [])

  const availableProviders = Object.values(providers ?? {}).filter(
    (provider) => provider.id !== 'credentials'
  )

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-12">
      <section className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
          The Green List
        </p>

        <h1 className="mb-3 text-3xl font-bold">Sign in</h1>

        <p className="mb-6 text-sm text-muted-foreground">
          Access your dashboard, reports, settings, and community features.
        </p>

        {error && (
          <div className="mb-5 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {errorMessages[error] ?? 'Sign-in failed. Please try again or contact support.'}
          </div>
        )}

        <div className="space-y-3">
          {availableProviders.length > 0 ? (
            availableProviders.map((provider) => (
              <button
                key={provider.id}
                type="button"
                onClick={() => signIn(provider.id, { callbackUrl })}
                className="w-full rounded-md border px-4 py-3 text-sm font-semibold transition-colors hover:bg-accent hover:text-background"
              >
                Continue with {provider.name}
              </button>
            ))
          ) : (
            <div className="rounded-md border border-accent/40 bg-accent/10 p-3 text-sm text-muted-foreground">
              No external login providers are currently enabled. Configure Google or Apple OAuth
              variables in Vercel, then redeploy.
            </div>
          )}
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          New here?{' '}
          <Link href="/auth/signup" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>

        <Link href="/" className="mt-6 block text-sm text-accent hover:underline">
          Back to homepage
        </Link>
      </section>
    </main>
  )
}
