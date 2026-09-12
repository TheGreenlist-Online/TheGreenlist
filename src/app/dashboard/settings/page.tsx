'use client'

import { useEffect, useState, useMemo } from 'react'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

export default function DashboardSettingsPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  // Maps to the real `profiles.is_public` column (see field-mismatch fix notes below).
  const [publicProfile, setPublicProfile] = useState(true)
  // NOTE: There is no `email_notifications` column on `profiles` and no notification-preferences
  // table in the live schema. This control is intentionally disabled/"coming soon" — see comment
  // in handleSave for details on the bug this replaces.
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        redirect('/auth/signin?callbackUrl=/dashboard/settings')
      }

      setEmail(user.email || '')

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, is_public')
        .eq('id', user!.id)
        .maybeSingle<{ display_name: string | null; is_public: boolean | null }>()

      if (profile) {
        setDisplayName(profile.display_name ?? '')
        setPublicProfile(profile.is_public ?? true)
      }

      setIsLoading(false)
    }

    checkAuth()
  }, [supabase])

  const handleSave = async () => {
    setIsSaving(true)
    setMessage('')

    try {
      // FIELD-MISMATCH FIX: this previously wrote `public_profile` and `email_notifications`
      // columns that do not exist on the live `profiles` table, so the upsert either silently
      // failed or silently wrote nothing useful. `public_profile` is now correctly mapped to the
      // real `is_public` column. `email_notifications` has no backing column/table at all, so it
      // is intentionally NOT sent here — that toggle is UI-only ("coming soon") until a
      // notification-preferences table exists.
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          is_public: publicProfile,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id)

      if (error) {
        console.warn('Preferences save failed:', error)
        setMessage('Could not save settings. Please try again.')
      } else {
        setMessage('✓ Settings saved successfully')
      }
    } catch (error) {
      console.warn('Could not save preferences:', error)
      setMessage('Could not save settings. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen smoke-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen smoke-surface flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-8">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Settings</p>
            <h1 className="greenlist-page-title">Account & Preferences</h1>
          </div>
        </section>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Manage your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name or username"
                  className="w-full px-3 py-2 bg-card border border-primary/40 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  className="w-full px-3 py-2 bg-muted border border-primary/40 rounded-lg text-muted-foreground cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here. Contact support.</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Privacy</CardTitle>
              <CardDescription>Control your profile visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={publicProfile}
                  onChange={(e) => setPublicProfile(e.target.checked)}
                  className="w-4 h-4 rounded border-primary/40 bg-card text-accent accent-accent"
                />
                <div>
                  <span className="font-medium text-foreground">Public Profile</span>
                  <p className="text-xs text-muted-foreground">Allow others to view your public activity and profile</p>
                </div>
              </label>
            </CardContent>
          </Card>

          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Email notification preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-3 cursor-not-allowed opacity-60">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(e) => setEmailNotifications(e.target.checked)}
                  disabled
                  className="w-4 h-4 rounded border-primary/40 bg-card text-accent accent-accent"
                />
                <div>
                  <span className="font-medium text-foreground">
                    Email Notifications{' '}
                    <span className="ml-1 rounded-full border border-amber-300/35 bg-amber-300/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-200">
                      Coming soon
                    </span>
                  </span>
                  <p className="text-xs text-muted-foreground">
                    Notification preferences aren&apos;t stored yet. This toggle doesn&apos;t save anywhere until that feature ships.
                  </p>
                </div>
              </label>
            </CardContent>
          </Card>

          {message && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm">
              {message}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/dashboard" className="flex-1">
              <button className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors">
                Cancel
              </button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
