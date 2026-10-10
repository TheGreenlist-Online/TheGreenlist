'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const MIN_PASSWORD_LEN = 10

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [hasSession, setHasSession] = useState<boolean | null>(null)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true
    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) setHasSession(Boolean(data.session))
    })

    return () => {
      isMounted = false
    }
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password.length < MIN_PASSWORD_LEN) {
      setError(`Use a password with at least ${MIN_PASSWORD_LEN} characters.`)
      return
    }

    if (password !== confirmPassword) {
      setError('The passwords do not match.')
      return
    }

    setIsSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    if (updateError) {
      setError(updateError.message || 'Could not update your password. Request a new recovery link and try again.')
      setIsSaving(false)
      return
    }

    const { error: signOutError } = await supabase.auth.signOut({ scope: 'local' })
    setPassword('')
    setConfirmPassword('')
    setIsSaving(false)
    setIsComplete(true)

    if (signOutError) {
      setError('Your password was updated, but this session could not be closed. Sign out before signing in again.')
      return
    }

    router.replace('/auth/signin?passwordReset=1')
    router.refresh()
  }

  return (
    <main className="auth-stage min-h-screen px-4 py-16 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center">
        <div className="gl-panel w-full">
          <div className="p-8">
            <p className="greenlist-eyebrow mb-3">The Green List</p>
            <h1 className="greenlist-page-title">Set a new password</h1>

            {hasSession === null ? (
              <p className="mt-8 text-sm text-[var(--gl-text-secondary)]">Checking your recovery session...</p>
            ) : null}

            {hasSession === false ? (
              <div className="mt-8 space-y-4">
                <div className="gl-notice gl-notice--alert" role="alert">
                  This recovery link is invalid or expired. Request a new link to continue.
                </div>
                <Link href="/auth/forgot-password" className="gl-link text-sm">Request a new recovery link</Link>
              </div>
            ) : null}

            {hasSession && !isComplete ? (
              <>
                <p className="mt-3 text-sm leading-6 text-[var(--gl-text-secondary)]">
                  Choose a new password. Supabase will reject passwords that are too weak or known to be compromised.
                </p>
                <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
                  <div className="gl-field">
                    <label className="gl-label" htmlFor="new-password">New password</label>
                    <Input
                      id="new-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={MIN_PASSWORD_LEN}
                      required
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                  <div className="gl-field">
                    <label className="gl-label" htmlFor="confirm-password">Confirm new password</label>
                    <Input
                      id="confirm-password"
                      type="password"
                      autoComplete="new-password"
                      minLength={MIN_PASSWORD_LEN}
                      required
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                    />
                  </div>
                  {error ? <div className="gl-notice gl-notice--alert" role="alert">{error}</div> : null}
                  <Button type="submit" className="w-full" disabled={isSaving}>
                    {isSaving ? 'Updating...' : 'Update password'}
                  </Button>
                </form>
              </>
            ) : null}

            {isComplete ? (
              <div className="mt-8 space-y-4">
                {error ? <div className="gl-notice gl-notice--alert" role="alert">{error}</div> : null}
                {!error ? <div className="gl-notice gl-notice--confirmed" role="status">Your password was updated.</div> : null}
                <Link href="/auth/signin" className="gl-link text-sm">Continue to sign in</Link>
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  )
}
