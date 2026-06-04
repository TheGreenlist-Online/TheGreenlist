'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function SignInPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-lg border bg-card p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
          THEBLACKLIST.ONLINE
        </p>

        <h1 className="mb-3 text-3xl font-bold">Sign in</h1>

        <p className="mb-6 text-sm text-muted-foreground">
          Access your profile, reports, settings, and community features.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full rounded-md border px-4 py-3 text-sm font-semibold hover:bg-accent hover:text-background transition-colors"
          >
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => signIn('apple', { callbackUrl: '/' })}
            className="w-full rounded-md border px-4 py-3 text-sm font-semibold hover:bg-accent hover:text-background transition-colors"
          >
            Continue with Apple
          </button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          New here?{' '}
          <Link href="/auth/signup" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>

        <Link href="/" className="mt-6 block text-sm text-accent hover:underline">
          ← Back to homepage
        </Link>
      </section>
    </main>
  )
}
