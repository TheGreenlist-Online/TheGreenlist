'use client'

import { FormEvent, useEffect, useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const { status } = useSession()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
      router.refresh()
    }
  }, [router, status])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    const normalizedEmail = email.toLowerCase().trim()

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: normalizedEmail, password }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(data.error ?? 'Unable to create account right now.')
        return
      }

      const result = await signIn('credentials', {
        email: normalizedEmail,
        password,
        redirect: false,
        callbackUrl: '/dashboard',
      })

      if (!result || result.error) {
        router.push('/auth/signin?registered=1')
        return
      }

      router.push(result.url ?? '/dashboard')
      router.refresh()
    } catch {
      setError('Unable to reach registration service. Try again in a moment.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen px-4 py-16 text-foreground smoke-surface">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center">
        <div className="glow-border w-full rounded-lg p-px">
          <div className="rounded-lg bg-card/95 p-8 shadow-2xl shadow-black/40 backdrop-blur">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.22em] text-accent">
              The Green List
            </p>
            <h1 className="text-3xl font-bold text-foreground">Create account</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Join the transparency network for reports, education, forums, and community accountability.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <label className="block text-sm font-medium text-foreground" htmlFor="name">
                Name
              </label>
              <Input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Your name"
              />

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
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 8 characters"
              />

              {error ? (
                <div className="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isLoading || status === 'loading'}>
                {isLoading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <p className="mt-6 text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-semibold text-accent hover:underline">
                Sign in
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
