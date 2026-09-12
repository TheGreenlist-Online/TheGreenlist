'use client'

import { useMemo, useState } from 'react'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { StatusMessage } from '@/components/settings/SettingsControls'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

const MIN_PASSWORD_LEN = 10

/**
 * Password change and session sign-out.
 *
 * Supabase requires a live session to change a password, so this runs in the
 * browser against the user's own session rather than through an API route.
 * `signOut({ scope: 'global' })` revokes every refresh token on the account,
 * which is the control you want after a lost or shared device.
 */
export function SecuritySettings({ email }: { email: string }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  const tooShort = password.length > 0 && password.length < MIN_PASSWORD_LEN
  const mismatch = confirmPassword.length > 0 && password !== confirmPassword
  const canSubmit = password.length >= MIN_PASSWORD_LEN && password === confirmPassword && !isSaving

  const inputClass =
    'mt-2 w-full rounded-lg border border-white/[.12] bg-black/30 px-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 transition focus:border-emerald-300/60 focus:outline-none focus:ring-2 focus:ring-emerald-300/20'

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!canSubmit) return

    setIsSaving(true)
    setResult(null)

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setResult({ tone: 'error', text: error.message || 'Could not update your password.' })
    } else {
      setResult({ tone: 'success', text: 'Your password was updated.' })
      setPassword('')
      setConfirmPassword('')
    }

    setIsSaving(false)
  }

  const handleGlobalSignOut = async () => {
    setIsSigningOut(true)
    await supabase.auth.signOut({ scope: 'global' })
    // Full reload so every server component re-renders without the session.
    window.location.href = '/'
  }

  return (
    <SettingsSection
      id="security"
      title="Security"
      description="Your sign-in credentials and active sessions."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-100">Sign out everywhere</p>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Ends your session on every device, including this one. Use it if you signed in somewhere you no longer
              trust.
            </p>
          </div>
          <button
            type="button"
            onClick={handleGlobalSignOut}
            disabled={isSigningOut}
            className="shrink-0 rounded-lg border border-red-300/30 bg-red-950/25 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-950/40 disabled:opacity-50"
          >
            {isSigningOut ? 'Signing out…' : 'Sign out everywhere'}
          </button>
        </div>
      }
    >
      <div>
        <span className="text-sm font-semibold text-zinc-100">Email address</span>
        <p className="mt-2 rounded-lg border border-white/[.08] bg-white/[.03] px-3 py-2.5 text-sm text-zinc-400">
          {email}
        </p>
        <p className="mt-1.5 text-xs leading-5 text-zinc-500">
          Your email is your sign-in identity and can&apos;t be changed here. Contact support to move your account to a
          new address.
        </p>
      </div>

      <form onSubmit={handlePasswordChange} className="space-y-5">
        <div>
          <label htmlFor="new-password" className="block text-sm font-semibold text-zinc-100">
            New password
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={`At least ${MIN_PASSWORD_LEN} characters`}
            className={inputClass}
          />
          {tooShort ? (
            <p className="mt-1.5 text-xs font-medium text-red-300">
              Use at least {MIN_PASSWORD_LEN} characters.
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirm-password" className="block text-sm font-semibold text-zinc-100">
            Confirm new password
          </label>
          <input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Re-enter the new password"
            className={inputClass}
          />
          {mismatch ? <p className="mt-1.5 text-xs font-medium text-red-300">The two passwords don&apos;t match.</p> : null}
        </div>

        {result ? <StatusMessage tone={result.tone}>{result.text}</StatusMessage> : null}

        <button type="submit" disabled={!canSubmit} className="greenlist-primary-button disabled:opacity-45">
          {isSaving ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </SettingsSection>
  )
}
