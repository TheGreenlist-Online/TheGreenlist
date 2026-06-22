'use client'

import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [profileVisibility, setProfileVisibility] = useState('PRIVATE')
  const [requestedAccountType, setRequestedAccountType] = useState('USER')
  const [allowAnonymousReports, setAllowAnonymousReports] = useState(true)
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsLoading(true)

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        password,
        profileVisibility,
        requestedAccountType: requestedAccountType === 'USER' ? null : requestedAccountType,
        allowAnonymousReports,
      }),
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      setIsLoading(false)
      setError(data.error ?? 'Unable to create account right now.')
      return
    }

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
      callbackUrl: '/dashboard',
    })

    setIsLoading(false)

    if (!result || result.error) {
      router.push('/auth/signin')
      return
    }

    router.push(result.url ?? '/dashboard')
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


              <label className="block text-sm font-medium text-foreground" htmlFor="requestedAccountType">
                Account type
              </label>
              <select
                id="requestedAccountType"
                value={requestedAccountType}
                onChange={(event) => setRequestedAccountType(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="USER">Community member</option>
                <option value="BUSINESS">Request business profile review</option>
                <option value="CULTIVATOR">Request cultivator profile review</option>
                <option value="DISTRIBUTOR">Request distributor profile review</option>
              </select>
              <p className="text-xs leading-5 text-muted-foreground">
                Organization roles are request-only and remain community accounts until admin approval.
              </p>

              <label className="block text-sm font-medium text-foreground" htmlFor="profileVisibility">
                Profile visibility
              </label>
              <select
                id="profileVisibility"
                value={profileVisibility}
                onChange={(event) => setProfileVisibility(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="PUBLIC">Public profile</option>
                <option value="PRIVATE">Private profile</option>
                <option value="BUSINESS_VISIBLE">Business-visible profile</option>
                <option value="ADMIN_ONLY">Admin-only/internal profile</option>
              </select>

              <label className="flex items-start gap-3 rounded-md border border-accent/20 bg-accent/5 p-3 text-sm text-muted-foreground" htmlFor="allowAnonymousReports">
                <input
                  id="allowAnonymousReports"
                  type="checkbox"
                  checked={allowAnonymousReports}
                  onChange={(event) => setAllowAnonymousReports(event.target.checked)}
                  className="mt-1"
                />
                <span>Allow anonymous reporting preferences for sensitive submissions where appropriate.</span>
              </label>

              {error ? (
                <div className="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
                  {error}
                </div>
              ) : null}

              <Button type="submit" className="w-full" disabled={isLoading}>
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
