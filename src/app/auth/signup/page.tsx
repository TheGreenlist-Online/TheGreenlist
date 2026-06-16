'use client'

import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-lg border bg-card p-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-accent">
          The Green List
        </p>

        <h1 className="mb-3 text-3xl font-bold">Create account</h1>

        <p className="mb-6 text-sm text-muted-foreground">
          Join the cannabis transparency platform and help build public accountability.
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full rounded-md border px-4 py-3 text-sm font-semibold hover:bg-accent hover:text-background transition-colors"
          >
            Sign up with Google
          </button>

          <button
            type="button"
            onClick={() => signIn('apple', { callbackUrl: '/' })}
            className="w-full rounded-md border px-4 py-3 text-sm font-semibold hover:bg-accent hover:text-background transition-colors"
          >
            Sign up with Apple
          </button>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>

        <Link href="/" className="mt-6 block text-sm text-accent hover:underline">
          Back to homepage
        </Link>
      </section>
    </main>
  )
}
