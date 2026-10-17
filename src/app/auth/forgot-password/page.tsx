'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { getAuthRedirectUrl } from '@/lib/supabase/env'

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setNotice('')
    setIsLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: getAuthRedirectUrl('/auth/confirm?flow=recovery'),
    })

    setIsLoading(false)
    if (resetError) {
      setError('We could not process that request. Please try again later.')
      return
    }

    setNotice('If an account matches that address, a password recovery link will be sent.')
  }

  return (
    <main className="auth-stage min-h-screen px-4 py-16 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center">
        <div className="gl-panel w-full">
          <div className="p-8">
            <p className="greenlist-eyebrow mb-3">The Green List</p>
            <h1 className="greenlist-page-title">Recover your password</h1>
            <p className="mt-3 text-sm leading-6 text-[var(--gl-text-secondary)]">
              Enter the email address associated with your account. If an account matches, we will send a recovery link.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
              <div className="gl-field">
                <label className="gl-label" htmlFor="email">Email</label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {error ? <div className="gl-notice gl-notice--alert" role="alert">{error}</div> : null}
              {notice ? <div className="gl-notice gl-notice--confirmed" role="status">{notice}</div> : null}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send recovery link'}
              </Button>
            </form>

            <Link href="/auth/signin" className="mt-6 block text-sm gl-link">Back to sign in</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
