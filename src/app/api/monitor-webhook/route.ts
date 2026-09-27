import { timingSafeEqual } from 'node:crypto'

import { NextResponse } from 'next/server'
import { z } from 'zod'

const webhookSchema = z.object({
  id: z.string().trim().max(200).optional(),
  email: z.string().trim().max(320).optional(),
  tags: z.array(z.string().trim().max(100)).max(100).optional(),
  type: z.string().trim().max(100).optional(),
})

function maskEmail(email: string | null): string | null {
  if (!email) return null

  const [localPart, domain] = email.split('@')
  if (!domain) return '[invalid-email]'

  return `${localPart.slice(0, 2)}***@${domain}`
}

function validWebhookSecret(request: Request): boolean {
  const expected =
    process.env.GHL_WEBHOOK_SECRET?.trim() ||
    process.env.GOHIGHLEVEL_SOURCE_TOKEN?.trim()
  const received = request.headers.get('x-ghl-webhook-secret')?.trim()

  if (!expected || !received) return false

  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(received)

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
  )
}

export async function POST(request: Request) {
  try {
    const configured = Boolean(
      process.env.GHL_WEBHOOK_SECRET?.trim() ||
        process.env.GOHIGHLEVEL_SOURCE_TOKEN?.trim(),
    )

    if (!configured) {
      console.error('[ghl:webhook] Inbound webhook secret is not configured.')
      return NextResponse.json(
        { error: 'Webhook is not configured.' },
        { status: 500 },
      )
    }

    if (!validWebhookSecret(request)) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }

    const body: unknown = await request.json()
    const parsed = webhookSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid webhook payload.' },
        { status: 400 },
      )
    }

    const contactId = parsed.data.id ?? null
    const email = parsed.data.email ?? null
    const tags = parsed.data.tags ?? []
    const type = parsed.data.type ?? null

    // Log only the transaction metadata needed for an audit trail. Masking the
    // email reduces unnecessary PII exposure in Vercel runtime logs.
    console.info('[ghl:webhook] Contact event received.', {
      contactId,
      email: maskEmail(email),
      tags,
      type,
      receivedAt: new Date().toISOString(),
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    console.error('[ghl:webhook] Unexpected request failure.')
    return NextResponse.json(
      { error: 'Unable to process the webhook at this time.' },
      { status: 500 },
    )
  }
}
