'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { StatusMessage, TextField, Toggle } from '@/components/settings/SettingsControls'

export type EditableProfile = {
  username: string
  display_name: string
  bio: string
  avatar_url: string
  is_public: boolean
  is_anonymous_allowed: boolean
}

/**
 * Identity and privacy settings.
 *
 * Writes go through PATCH /api/profiles, which re-checks the session and
 * validates every field on the server. The old page wrote to Supabase straight
 * from the browser and sent two columns (`public_profile`, `email_notifications`)
 * that do not exist on the table, so saves silently did nothing.
 *
 * Only changed fields are sent, and the save button stays disabled until
 * something actually changes, so the form can't report success for a no-op.
 */
export function ProfileSettingsForm({ initial }: { initial: EditableProfile }) {
  const router = useRouter()
  const [saved, setSaved] = useState<EditableProfile>(initial)
  const [form, setForm] = useState<EditableProfile>(initial)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [fieldError, setFieldError] = useState<{ field: string; message: string } | null>(null)

  const changed = useMemo(
    () => (Object.keys(form) as (keyof EditableProfile)[]).filter((key) => form[key] !== saved[key]),
    [form, saved],
  )
  const isDirty = changed.length > 0

  const set = <K extends keyof EditableProfile>(key: K, value: EditableProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setResult(null)
    if (fieldError?.field === key) setFieldError(null)
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isDirty || isSaving) return

    setIsSaving(true)
    setResult(null)
    setFieldError(null)

    // Send only what changed so an untouched field can never be overwritten.
    const payload = Object.fromEntries(changed.map((key) => [key, form[key]]))

    try {
      const response = await fetch('/api/profiles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => null)

      if (!response.ok) {
        const message = body?.error ?? 'Could not save your changes. Please try again.'
        if (body?.field) setFieldError({ field: body.field, message })
        setResult({ tone: 'error', text: message })
        return
      }

      // Trust the row the server returns rather than the local guess — it has
      // the normalised username and any server-applied trimming.
      const next: EditableProfile = {
        username: body?.username ?? form.username,
        display_name: body?.display_name ?? '',
        bio: body?.bio ?? '',
        avatar_url: body?.avatar_url ?? '',
        is_public: body?.is_public ?? form.is_public,
        is_anonymous_allowed: body?.is_anonymous_allowed ?? form.is_anonymous_allowed,
      }
      setSaved(next)
      setForm(next)
      setResult({ tone: 'success', text: 'Your settings were saved.' })
      // Header, profile and dashboard all read this row.
      router.refresh()
    } catch {
      setResult({ tone: 'error', text: 'Could not reach the server. Check your connection and try again.' })
    } finally {
      setIsSaving(false)
    }
  }

  const errorFor = (field: keyof EditableProfile) =>
    fieldError?.field === field ? fieldError.message : undefined

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SettingsSection
        id="profile"
        title="Public identity"
        description="How you appear to the community. Reports you file anonymously never show these details."
      >
        <TextField
          id="username"
          label="Username"
          prefix="@"
          value={form.username}
          onChange={(value) => set('username', value)}
          maxLength={30}
          error={errorFor('username')}
          hint="Your permanent handle and profile address. Lowercase letters, numbers and underscores."
        />

        <TextField
          id="display_name"
          label="Display name"
          value={form.display_name}
          onChange={(value) => set('display_name', value)}
          maxLength={80}
          showCount
          placeholder="The name shown on your posts"
          hint="Optional. Shown instead of your username where there is room for it."
        />

        <TextField
          id="bio"
          label="Bio"
          value={form.bio}
          onChange={(value) => set('bio', value)}
          maxLength={1000}
          showCount
          multiline
          placeholder="A short description of who you are and what you contribute."
          hint="Optional. Visible on your public profile."
        />

        <TextField
          id="avatar_url"
          label="Avatar URL"
          value={form.avatar_url}
          onChange={(value) => set('avatar_url', value)}
          placeholder="https://example.com/avatar.jpg"
          hint="Optional. Must be a public https image address."
        />
      </SettingsSection>

      <SettingsSection
        id="privacy"
        title="Privacy"
        description="Who can see your profile, and whether you can file reports without your name attached."
      >
        <Toggle
          id="is_public"
          label="Public profile"
          description="Let anyone view your profile page and your public contribution history. Turn this off and your profile is visible only to you."
          checked={form.is_public}
          onChange={(value) => set('is_public', value)}
        />

        <Toggle
          id="is_anonymous_allowed"
          label="Allow anonymous submissions"
          description="Keep the option to file a report or open a thread without your name attached. Moderators still see who submitted it for accountability."
          checked={form.is_anonymous_allowed}
          onChange={(value) => set('is_anonymous_allowed', value)}
        />
      </SettingsSection>

      {result ? <StatusMessage tone={result.tone}>{result.text}</StatusMessage> : null}

      {/* Sticky so the save button is reachable without scrolling back down. */}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-white/[.09] bg-brand-panel/95 px-4 py-3 backdrop-blur">
        <button type="submit" disabled={!isDirty || isSaving} className="greenlist-primary-button disabled:opacity-45">
          {isSaving ? 'Saving…' : 'Save changes'}
        </button>

        {isDirty ? (
          <button
            type="button"
            onClick={() => {
              setForm(saved)
              setResult(null)
              setFieldError(null)
            }}
            className="greenlist-quiet-button"
          >
            Discard
          </button>
        ) : null}

        <p className="text-xs text-zinc-500">
          {isDirty
            ? `${changed.length} unsaved ${changed.length === 1 ? 'change' : 'changes'}`
            : 'All changes saved'}
        </p>
      </div>
    </form>
  )
}
