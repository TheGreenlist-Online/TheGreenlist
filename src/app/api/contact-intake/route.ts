import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { gohighlevel } from '@/lib/integrations/gohighlevel'

const inquiryValues = ['general', 'partnership', 'sponsor', 'affiliate', 'support'] as const

const intakeSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().email().max(254).transform((value) => value.toLowerCase().trim()),
  phone: z.string().trim().max(40).optional().or(z.literal('')),
  organization: z.string().trim().max(160).optional().or(z.literal('')),
  website: z.string().trim().url().max(300).optional().or(z.literal('')),
  inquiryType: z.enum(inquiryValues),
  message: z.string().trim().min(12).max(2000),
  consent: z.boolean().refine((value) => value, 'Consent is required'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = intakeSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid contact intake payload.', details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const payload = parsed.data
    const baseLead = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone || undefined,
      inquiryType: payload.inquiryType,
      organization: payload.organization || undefined,
      website: payload.website || undefined,
      messagePreview: payload.message.slice(0, 500),
    }

    await gohighlevel.contactLeadSubmitted(baseLead)

    if (payload.inquiryType === 'sponsor' || payload.inquiryType === 'affiliate') {
      await gohighlevel.sponsorIntakeSubmitted({
        contactName: payload.name,
        organization: payload.organization || undefined,
        email: payload.email,
        inquiryType: payload.inquiryType,
        website: payload.website || undefined,
      })
    }

    return NextResponse.json(
      { ok: true, message: 'Thanks. Your request has been routed for review.' },
      { status: 202 },
    )
  } catch (error) {
    console.error('[contact intake] Error:', error)
    return NextResponse.json(
      { error: 'Failed to process contact intake.' },
      { status: 500 },
    )
  }
}
