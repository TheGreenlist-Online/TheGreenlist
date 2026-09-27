import 'server-only'

const GHL_API_BASE_URL = 'https://services.leadconnectorhq.com'
const GHL_API_VERSION = '2021-04-15'

type IntegrationPayload = Record<string, unknown>

export type GhlCustomField = {
  id: string
  field_value: string | number | boolean | readonly string[]
}

export type GhlContact = {
  id: string
  email?: string | null
  tags?: readonly string[] | null
}

type GhlContactResponse = {
  contact?: GhlContact
}

export class GhlConfigurationError extends Error {}

export class GhlApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message)
  }
}

function getPrivateIntegrationToken(): string {
  const token = process.env.GOHIGHLEVEL_PIT?.trim()

  if (!token) {
    throw new GhlConfigurationError('GOHIGHLEVEL_PIT is not configured')
  }

  return token
}

function getGoHighLevelConfig() {
  const webhookUrl = process.env.GOHIGHLEVEL_WEBHOOK_URL?.trim() ?? ''
  const locationId = process.env.GOHIGHLEVEL_LOCATION_ID?.trim() ?? ''
  const sourceToken = process.env.GOHIGHLEVEL_SOURCE_TOKEN?.trim() ?? ''
  let validWebhook = false

  if (webhookUrl && !webhookUrl.startsWith('replace-')) {
    try {
      const parsed = new URL(webhookUrl)
      validWebhook = parsed.protocol === 'https:' && parsed.hostname.length > 0
    } catch {
      validWebhook = false
    }
  }

  return { webhookUrl, locationId, sourceToken, isConfigured: validWebhook }
}

function ghlHeaders(): HeadersInit {
  return {
    Authorization: `Bearer ${getPrivateIntegrationToken()}`,
    Version: GHL_API_VERSION,
    'Content-Type': 'application/json',
  }
}

async function parseGhlResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    // Never include the upstream body. It may contain contact data or internal
    // details that should not be returned to a caller or written to logs.
    throw new GhlApiError('GoHighLevel request failed', response.status)
  }

  return (await response.json()) as T
}

function scrubSensitiveFields(payload: IntegrationPayload) {
  const bannedKeys = [
    'description',
    'evidence',
    'ip',
    'metadata',
    'attachments',
    'report',
  ]

  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (value === undefined || value === null) return false
      const normalized = key.toLowerCase()
      return !bannedKeys.some((blocked) => normalized.includes(blocked))
    }),
  )
}

async function sendGoHighLevelWebhook(
  eventName: string,
  payload: IntegrationPayload,
) {
  const config = getGoHighLevelConfig()

  if (!config.isConfigured) {
    console.info(`[gohighlevel] Webhook not configured. Skipping: ${eventName}`)
    return { ok: true, skipped: true }
  }

  try {
    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.sourceToken
          ? { Authorization: `Token ${config.sourceToken}` }
          : {}),
      },
      body: JSON.stringify({
        event: eventName,
        timestamp: new Date().toISOString(),
        locationId: config.locationId || null,
        source: 'thegreenlist',
        data: scrubSensitiveFields(payload),
      }),
      cache: 'no-store',
    })

    if (!response.ok) {
      console.error('[gohighlevel] Outbound webhook failed.', {
        status: response.status,
        eventName,
      })
      return { ok: false, status: response.status }
    }

    return { ok: true }
  } catch {
    console.error('[gohighlevel] Outbound webhook request failed.', {
      eventName,
    })
    return { ok: false, error: 'Webhook request failed' }
  }
}

export async function createGhlContact(input: {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  customFields?: readonly GhlCustomField[]
}): Promise<GhlContactResponse> {
  const locationId = process.env.GOHIGHLEVEL_LOCATION_ID?.trim()

  if (!locationId) {
    throw new GhlConfigurationError('GOHIGHLEVEL_LOCATION_ID is not configured')
  }

  const response = await fetch(`${GHL_API_BASE_URL}/contacts/`, {
    method: 'POST',
    headers: ghlHeaders(),
    body: JSON.stringify({
      locationId,
      email: input.email,
      ...(input.firstName ? { firstName: input.firstName } : {}),
      ...(input.lastName ? { lastName: input.lastName } : {}),
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.customFields?.length
        ? { customFields: input.customFields }
        : {}),
    }),
    cache: 'no-store',
  })

  return parseGhlResponse<GhlContactResponse>(response)
}

export async function getGhlContact(contactId: string): Promise<GhlContact> {
  const response = await fetch(
    `${GHL_API_BASE_URL}/contacts/${encodeURIComponent(contactId)}`,
    {
      method: 'GET',
      headers: ghlHeaders(),
      cache: 'no-store',
    },
  )
  const payload = await parseGhlResponse<GhlContactResponse>(response)

  if (!payload.contact) {
    throw new GhlApiError('GoHighLevel returned no contact', response.status)
  }

  return payload.contact
}

export const gohighlevel = {
  isConfigured: () => getGoHighLevelConfig().isConfigured,
  config: getGoHighLevelConfig,
  send: sendGoHighLevelWebhook,

  contactLeadSubmitted: (payload: {
    name: string
    email: string
    phone?: string
    inquiryType: string
    organization?: string
    website?: string
  }) => sendGoHighLevelWebhook('contact-lead-submitted', payload),

  sponsorIntakeSubmitted: (payload: {
    contactName: string
    organization?: string
    email: string
    inquiryType: string
    website?: string
  }) => sendGoHighLevelWebhook('sponsor-intake-submitted', payload),

  businessClaimSubmitted: (payload: {
    businessId: string
    businessName: string
    businessType: string
    state?: string
    city?: string
    ownerUserId: string
  }) => sendGoHighLevelWebhook('business-claim-submitted', payload),

  onboardingQueued: (payload: {
    userId: string
    pathway: 'business-claim' | 'owner-invite'
    businessId?: string
  }) => sendGoHighLevelWebhook('onboarding-queued', payload),

  reengagementSegmentUpdated: (payload: {
    segment: string
    audienceSize: number
    criteria: string
  }) => sendGoHighLevelWebhook('reengagement-segment-updated', payload),
}
