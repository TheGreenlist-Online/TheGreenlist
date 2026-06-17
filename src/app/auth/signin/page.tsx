'use client'

import { FormEvent, useEffect, useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function getSafeCallbackUrl(callbackUrl: string | null) {
  if (!callbackUrl || !callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) {
    return '/dashboard'
  }

  return callbackUrl
}

export default function SignInPage() {
  const router = useRouter()
  const [callbackUrl, setCallbackUrl] = useState('/dashboard')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCallbackUrl(getSafeCallbackUrl(params.get('callbackUrl')))

    if (params.get('error')) {
      setError('Sign in failed. Check your details and try again.')
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl,
    })

    setIsLoading(false)

    if (!result || result.error) {
      setError('Invalid email or password.')
      return
    }

    router.push(result.url ?? callbackUrl)
    router.refresh()
  }

  return (
    <main className="min-h-screen px-4 py-16 text-foreground smoke-surface">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center">
        <div className="glow-border w-full rounded-lg p-px">
          <div className="rounded-lg bg-card/95 p-8 shadow-2xl shadow-black/40 backdrop-blur">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-accent">
              The Green List
            </p>
            <h1 className="text-3xl font-bold text-foreground">Sign in</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Access your dashboard, reports, forums, and community trust tools.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block text-sm font-medium text-foreground" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />

              <label className="block text-sm font-medium text-foreground" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Your password"
              />

              {error ? (
                <div className="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>

            <div className="mt-6 grid gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => signIn('google', { callbackUrl })}
                className="w-full"
              >
                Continue with Google
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => signIn('apple', { callbackUrl })}
                className="w-full"
              >
                Continue with Apple
              </Button>
            </div>

            <p className="mt-6 text-sm text-muted-foreground">
              New here?{' '}
              <Link href="/auth/register" className="font-semibold text-accent hover:underline">
                Create an account
              </Link>
            </p>
            <Link href="/" className="mt-6 block text-sm text-accent hover:underline">
              Back to homepage
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}
