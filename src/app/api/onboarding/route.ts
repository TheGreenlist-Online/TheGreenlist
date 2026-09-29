import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  createGhlContact,
  GhlApiError,
  GhlConfigurationError,
} from '@/lib/integrations/gohighlevel'

const customFieldSchema = z.object({
  id: z.string().trim().min(1),
  field_value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
  ]),
})

const onboardingSchema = z.object({
  email: z.email().trim().toLowerCase(),
  firstName: z.string().trim().max(100).optional(),
  lastName: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(30).optional(),
  customFields: z.array(customFieldSchema).max(100).optional(),
})

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = onboardingSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'A valid email and valid contact fields are required.' },
        { status: 400 },
      )
    }

    const result = await createGhlContact(parsed.data)

    return NextResponse.json({ success: true, contact: result.contact ?? null })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
    }

    if (error instanceof GhlConfigurationError) {
      console.error('[ghl:onboarding] Server configuration is incomplete.')
    } else if (error instanceof GhlApiError) {
      console.error('[ghl:onboarding] Upstream request failed.', {
        upstreamStatus: error.status,
      })
    } else {
      console.error('[ghl:onboarding] Unexpected request failure.')
    }

    return NextResponse.json(
      { error: 'Unable to create the contact at this time.' },
      { status: 500 },
    )
  }
}
