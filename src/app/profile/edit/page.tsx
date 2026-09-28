'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PageShell } from '@/components/PageShell'
import { PageIntro } from '@/components/PageIntro'
import { Field, FormActions, Input, Notice, Panel, Textarea } from '@/components/record'
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
      <PageShell width="record">
        <PageIntro eyebrow="Account" title="Edit profile" />
        <p className="gl-meta mt-8">
          <span>Loading profile…</span>
        </p>
      </PageShell>
    )
  }

  if (notSignedIn) {
    return (
      <PageShell width="record">
        <PageIntro eyebrow="Account" title="Edit profile" />
        <Notice tone="info" className="mt-8">
          <Link href="/auth/signin?callbackUrl=/profile/edit" className="gl-link">
            Sign in
          </Link>{' '}
          to edit your profile.
        </Notice>
      </PageShell>
    )
  }

  return (
    <PageShell width="record">
      <PageIntro
        eyebrow="Account"
        title="Edit profile"
        lede={profile ? undefined : 'No profile row exists for this account yet. Saving will create one.'}
        meta={<span>{profile?.username ? `@${profile.username}` : 'Username assigned by an administrator'}</span>}
        actions={
          <Link href="/profile" className="greenlist-quiet-button">
            Cancel
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
        <Panel title="Public details" aside={<span>Shown on your account record</span>}>
          <Field label="Display name" htmlFor="display-name" help="Up to 80 characters.">
            <Input id="display-name" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} maxLength={80} />
          </Field>
          <Field label="Statement" htmlFor="bio" help="A short factual description. Optional; up to 1,000 characters.">
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} rows={4} className="min-h-28" />
          </Field>
          <Field label="Avatar URL" htmlFor="avatar-url" help="Link to an image. File uploads are not supported.">
            <Input id="avatar-url" type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://" />
          </Field>
        </Panel>

        <Panel title="Visibility">
          <label className="flex items-start gap-3 text-sm text-[var(--gl-text-secondary)]">
            <input type="checkbox" className="mt-1" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
            <span>
              <span className="block font-medium text-[var(--gl-text)]">Public profile</span>
              <span>Show your statement, role, and confirmed facts at your public profile address. When off, only your username and avatar are shown.</span>
            </span>
          </label>
        </Panel>

        {message ? (
          <Notice tone="confirmed" role="status">
            {message}
          </Notice>
        ) : null}
        {error ? <Notice tone="alert">{error}</Notice> : null}

        <FormActions className="mt-0">
          <button type="submit" disabled={saving} className="greenlist-primary-button disabled:opacity-50">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <Link href="/profile" className="greenlist-quiet-button">
            Cancel
          </Link>
        </FormActions>
      </form>
    </PageShell>
  )
}
