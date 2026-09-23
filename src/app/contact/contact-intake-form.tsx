'use client'

import { FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const INQUIRY_TYPES = [
  { value: 'general', label: 'General question' },
  { value: 'partnership', label: 'Partnership inquiry' },
  { value: 'sponsor', label: 'Sponsor inquiry' },
  { value: 'affiliate', label: 'Affiliate inquiry' },
  { value: 'support', label: 'Support request' },
] as const

export function ContactIntakeForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [organization, setOrganization] = useState('')
  const [website, setWebsite] = useState('')
  const [inquiryType, setInquiryType] = useState<(typeof INQUIRY_TYPES)[number]['value']>('general')
  const [message, setMessage] = useState('')
  const [consent, setConsent] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setSuccess('')
    setSubmitting(true)

    try {
      const response = await fetch('/api/contact-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          organization,
          website,
          inquiryType,
          message,
          consent,
        }),
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(payload?.error || 'Contact intake failed. Please try again.')
      }

      setSuccess('Thanks. Your request was sent and routed to the right workflow.')
      setName('')
      setEmail('')
      setPhone('')
      setOrganization('')
      setWebsite('')
      setInquiryType('general')
      setMessage('')
      setConsent(false)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Contact intake failed.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-5 rounded-2xl border border-white/10 bg-black/20 p-5 md:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          Full name
          <Input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} />
        </label>
        <label className="space-y-2 text-sm font-medium">
          Email
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          Phone (optional)
          <Input value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} />
        </label>
        <label className="space-y-2 text-sm font-medium">
          Organization (optional)
          <Input value={organization} onChange={(event) => setOrganization(event.target.value)} maxLength={160} />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium">
          Website (optional)
          <Input type="url" value={website} onChange={(event) => setWebsite(event.target.value)} maxLength={300} />
        </label>
        <label className="space-y-2 text-sm font-medium">
          Inquiry type
          <select
            className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={inquiryType}
            onChange={(event) => setInquiryType(event.target.value as (typeof INQUIRY_TYPES)[number]['value'])}
          >
            {INQUIRY_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="space-y-2 text-sm font-medium">
        Message
        <textarea
          className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          required
          minLength={12}
          maxLength={2000}
        />
      </label>

      <label className="flex items-start gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          className="mt-1"
          required
        />
        I consent to being contacted about this request and understand that this form is for transparency-platform operations only.
      </label>

      {error ? (
        <p role="alert" className="rounded-md border border-red-400/40 bg-red-950/40 px-3 py-2 text-sm text-red-100">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="rounded-md border border-emerald-400/40 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-100">
          {success}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Submitting…' : 'Submit intake request'}
      </Button>
    </form>
  )
}
