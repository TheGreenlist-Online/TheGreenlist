'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

function getSafeCallbackUrl(callbackUrl: string | null) {
 if (!callbackUrl || !callbackUrl.startsWith('/') || callbackUrl.startsWith('//')) return '/dashboard'
 return callbackUrl
}

function getErrorMessage(errorParam: string | null) {
 if (errorParam === 'confirm_failed') return 'Email confirmation failed. Try signing in or request a new confirmation email.'
 if (errorParam) return 'Sign in failed. Check your details and try again.'
 return ''
}

export default function SignInPage() {
 const router = useRouter()
 const supabase = useMemo(() => createSupabaseBrowserClient(), [])
 const [callbackUrl, setCallbackUrl] = useState('/dashboard')
 const [email, setEmail] = useState('')
 const [password, setPassword] = useState('')
 const [error, setError] = useState('')
 const [notice, setNotice] = useState('')
 const [isLoading, setIsLoading] = useState(false)
 const [isCheckingSession, setIsCheckingSession] = useState(true)
 const [existingSession, setExistingSession] = useState(false)

 useEffect(() => {
 let isMounted = true
 const params = new URLSearchParams(window.location.search)
 const initializeFromUrl = window.setTimeout(() => {
 if (!isMounted) return
 setCallbackUrl(getSafeCallbackUrl(params.get('callbackUrl')))
 setError(getErrorMessage(params.get('error')))
 if (params.get('passwordReset')) setNotice('Your password was updated. Sign in with your new password.')
 if (params.get('registered')) setNotice('Account created. Sign in after confirming your email.')
 }, 0)

 supabase.auth.getSession().then(({ data }) => {
 if (!isMounted) return
 setExistingSession(Boolean(data.session))
 setIsCheckingSession(false)
 })

 return () => {
 isMounted = false
 window.clearTimeout(initializeFromUrl)
 }
 }, [supabase])

 async function handleSubmit(event: FormEvent<HTMLFormElement>) {
 event.preventDefault()
 setError('')
 setNotice('')
 setIsLoading(true)

 const { error: signInError } = await supabase.auth.signInWithPassword({
 email: email.toLowerCase().trim(),
 password,
 })

 setIsLoading(false)
 if (signInError) {
 setError('Invalid email or password. If your current password may be compromised, use Forgot password to reset it.')
 return
 }

 router.replace(callbackUrl)
 router.refresh()
 }

 async function signOutAndUseAnotherAccount() {
 setIsLoading(true)
 await supabase.auth.signOut()
 setExistingSession(false)
 setIsLoading(false)
 }

 return (
 <main className="auth-stage min-h-screen px-4 py-16 text-foreground">
 <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center">
 <div className="gl-panel w-full">
 <div className="p-8">
 <p className="greenlist-eyebrow mb-3">The Green List</p>
 <h1 className="greenlist-page-title">Sign in</h1>
 <p className="mt-3 text-sm leading-6 text-[var(--gl-text-secondary)]">Access your filings, evidence submissions, discussion, and account settings. Reading the record requires no account.</p>

 {isCheckingSession ? <p className="mt-8 text-sm text-[var(--gl-text-secondary)]">Checking your session...</p> : null}

 {!isCheckingSession && existingSession ? (
 <div className="mt-8 space-y-4">
 <div className="gl-notice gl-notice--confirmed">
 You are already signed in on this device. The session stays active until you sign out or it expires.
 </div>
 <Button className="w-full" onClick={() => router.replace(callbackUrl)}>Continue to {callbackUrl === '/dashboard' ? 'dashboard' : 'requested page'}</Button>
 <Button className="w-full" variant="outline" onClick={signOutAndUseAnotherAccount} disabled={isLoading}>Sign out and use another account</Button>
 </div>
 ) : null}

 {!isCheckingSession && !existingSession ? (
 <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
 <div className="gl-field">
 <label className="gl-label" htmlFor="email">Email</label>
 <Input id="email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" />
 </div>
 <div className="gl-field">
 <label className="gl-label" htmlFor="password">Password</label>
 <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
 <Link href="/auth/forgot-password" className="mt-2 inline-block text-sm gl-link">Forgot password?</Link>
 </div>
 {error ? <div className="gl-notice gl-notice--alert">{error}</div> : null}
 {notice ? <div className="gl-notice gl-notice--confirmed">{notice}</div> : null}
 <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? 'Signing in...' : 'Sign in'}</Button>
 </form>
 ) : null}

 <p className="mt-6 text-sm text-[var(--gl-text-secondary)]">No account? <Link href="/auth/register" className="gl-link">Request access</Link></p>
 <Link href="/" className="mt-6 block text-sm gl-link">Back to homepage</Link>
 </div>
 </div>
 </section>
 </main>
 )
}
