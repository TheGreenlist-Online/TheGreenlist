import { NextResponse } from 'next/server'
import { z } from 'zod'

import {
  getGhlContact,
  GhlApiError,
  GhlConfigurationError,
} from '@/lib/integrations/gohighlevel'

const requestSchema = z.object({
  contactId: z.string().trim().min(1).max(200),
})

const ACCESS_TAGS = {
  Active_Member: ['member'],
  Premium_Tier: ['member', 'premium'],
} as const

function rolesForTags(tags: readonly string[]): string[] {
  const normalizedTags = new Set(tags.map((tag) => tag.trim().toLowerCase()))
  const roles = new Set<string>()

  for (const [tag, tagRoles] of Object.entries(ACCESS_TAGS)) {
    if (normalizedTags.has(tag.toLowerCase())) {
      tagRoles.forEach((role) => roles.add(role))
    }
  }

  return Array.from(roles)
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = requestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { accessAllowed: false, roles: [] },
        { status: 400 },
      )
    }

    const contact = await getGhlContact(parsed.data.contactId)
    const roles = rolesForTags(contact.tags ?? [])

    return NextResponse.json({ accessAllowed: roles.length > 0, roles })
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { accessAllowed: false, roles: [], error: 'Invalid JSON body.' },
        { status: 400 },
      )
    }

    if (error instanceof GhlConfigurationError) {
      console.error('[ghl:membership] Server configuration is incomplete.')
    } else if (error instanceof GhlApiError) {
      console.error('[ghl:membership] Upstream request failed.', {
        upstreamStatus: error.status,
      })
    } else {
      console.error('[ghl:membership] Unexpected request failure.')
    }

    return NextResponse.json(
      {
        accessAllowed: false,
        roles: [],
        error: 'Unable to validate membership at this time.',
      },
      { status: 500 },
    )
  }
}
