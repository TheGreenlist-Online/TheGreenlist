'use client'

import { FormEvent, useState } from 'react'
import { Field, FormActions, Input, Notice, Select, Textarea } from '@/components/record'

const INQUIRY_TYPES = [
 { value: 'general', label: 'General question' },
 { value: 'support', label: 'Account or access' },
 { value: 'partnership', label: 'Data or institutional request' },
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
 throw new Error(payload?.error || 'The message could not be sent. Try again.')
 }

 setSuccess('Received. Your message has been logged and routed to the relevant desk.')
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
    <form onSubmit={handleSubmit} className="gl-panel">
      <div className="gl-panel__body grid gap-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Full name" htmlFor="contact-name" required>
            <Input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={120} />
          </Field>
          <Field label="Email" htmlFor="contact-email" required>
            <Input id="contact-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Phone" htmlFor="contact-phone" help="Optional.">
            <Input id="contact-phone" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={40} />
          </Field>
          <Field label="Organisation" htmlFor="contact-org" help="Optional.">
            <Input id="contact-org" value={organization} onChange={(event) => setOrganization(event.target.value)} maxLength={160} />
          </Field>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Website" htmlFor="contact-web" help="Optional.">
            <Input id="contact-web" type="url" value={website} onChange={(event) => setWebsite(event.target.value)} maxLength={300} />
          </Field>
          <Field label="Subject" htmlFor="contact-type">
            <Select
              id="contact-type"
              value={inquiryType}
              onChange={(event) => setInquiryType(event.target.value as (typeof INQUIRY_TYPES)[number]['value'])}
            >
              {INQUIRY_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Message" htmlFor="contact-message" required help="12 to 2,000 characters. Do not include report evidence here; file a report instead.">
          <Textarea
            id="contact-message"
            className="min-h-36"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            minLength={12}
            maxLength={2000}
          />
        </Field>

        <label className="flex items-start gap-3 text-sm text-[var(--gl-text-secondary)]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            className="mt-1 h-4 w-4 border-[var(--gl-border-strong)] bg-[var(--gl-ink)] accent-[var(--gl-accent)]"
            required
          />
          I consent to being contacted about this message and understand that it is logged for operational purposes.
        </label>

        {error ? <Notice tone="alert">{error}</Notice> : null}
        {success ? <Notice tone="confirmed">{success}</Notice> : null}

        <FormActions>
          <button type="submit" className="greenlist-primary-button" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send message'}
          </button>
        </FormActions>
      </div>
    </form>
  )
}
