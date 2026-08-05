'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

type ProfileRow = {
  id: string
  username: string | null
  display_name: string | null
  bio: string | null
  avatar_url: string | null
  is_public: boolean | null
}

export default function ProfileEditPage() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notSignedIn, setNotSignedIn] = useState(false)
  const [profile, setProfile] = useState<ProfileRow | null>(null)

  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let mounted = true

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (mounted) {
          setNotSignedIn(true)
          setLoading(false)
        }
        return
      }

      const { data } = await supabase
        .from('profiles')
        .select('id, username, display_name, bio, avatar_url, is_public')
        .eq('id', user.id)
        .maybeSingle<ProfileRow>()

      if (!mounted) return

      setProfile(data ?? null)
      setDisplayName(data?.display_name ?? '')
      setBio(data?.bio ?? '')
      setAvatarUrl(data?.avatar_url ?? '')
      setIsPublic(data?.is_public ?? true)
      setLoading(false)
    }

    load()

    return () => {
      mounted = false
    }
  }, [supabase])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setError('')
    setSaving(true)

    try {
      const response = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
          is_public: isPublic,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || 'Failed to save profile')
      }

      setMessage('✓ Profile updated')
      setTimeout(() => router.push('/profile'), 700)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen smoke-surface flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    )
  }

  if (notSignedIn) {
    return (
      <div className="min-h-screen smoke-surface flex items-center justify-center">
        <div className="text-center">
          <p className="text-foreground">Please sign in to edit your profile.</p>
          <Link href="/auth/signin?callbackUrl=/profile/edit" className="mt-3 inline-block text-accent hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen smoke-surface flex flex-col">
      <main className="flex-1 container mx-auto px-4 py-12">
        <section className="glow-border rounded-lg p-px mb-8">
          <div className="rounded-lg bg-card/90 p-6 backdrop-blur md:p-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-accent">Profile</p>
            <h1 className="mt-3 text-3xl font-bold">Edit Profile</h1>
            {!profile ? (
              <p className="mt-2 text-sm text-muted-foreground">
                You don&apos;t have a profile row yet — saving will create one.
              </p>
            ) : null}
          </div>
        </section>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <Card className="border-primary/40">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                {profile?.username ? `@${profile.username}` : 'Your username is set by an administrator and cannot be changed here.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={80}
                  placeholder="Your display name"
                  className="w-full px-3 py-2 bg-card border border-primary/40 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={1000}
                  rows={4}
                  placeholder="Tell the community a bit about yourself"
                  className="w-full px-3 py-2 bg-card border border-primary/40 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Avatar URL</label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-3 py-2 bg-card border border-primary/40 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent"
                />
                <p className="text-xs text-muted-foreground mt-1">Paste a link to an image. File uploads aren&apos;t supported yet.</p>
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
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-primary/40 bg-card text-accent accent-accent"
                />
                <div>
                  <span className="font-medium text-foreground">Public Profile</span>
                  <p className="text-xs text-muted-foreground">Allow others to view your bio, badges, and scores at your public profile URL</p>
                </div>
              </label>
            </CardContent>
          </Card>

          {message && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/30 text-accent text-sm">{message}</div>
          )}
          {error && (
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">{error}</div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-6 py-3 bg-accent text-accent-foreground rounded-lg font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <Link href="/profile" className="flex-1">
              <button type="button" className="w-full px-6 py-3 bg-muted text-muted-foreground rounded-lg font-semibold hover:bg-muted/80 transition-colors">
                Cancel
              </button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  )
}
