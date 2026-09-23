/**
 * GoHighLevel Integration Framework
 *
 * This module provides a safe automation bridge for CRM and lifecycle workflows.
 * It is optional and does not block core platform behavior when not configured.
 */

type IntegrationPayload = Record<string, unknown>

function getGoHighLevelConfig() {
  const webhookUrl = (process.env.GOHIGHLEVEL_WEBHOOK_URL || '').trim()
  const locationId = (process.env.GOHIGHLEVEL_LOCATION_ID || '').trim()
  const sourceToken = (process.env.GOHIGHLEVEL_SOURCE_TOKEN || '').trim()

  return {
    webhookUrl,
    locationId,
    sourceToken,
    isConfigured:
      !!webhookUrl &&
      !webhookUrl.startsWith('replace-') &&
      !webhookUrl.includes('your-domain.com'),
  }
}

function scrubSensitiveFields(payload: IntegrationPayload) {
  const bannedKeys = ['description', 'evidence', 'ip', 'metadata', 'attachments', 'report']

  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (value === undefined || value === null) return false
      const normalized = key.toLowerCase()
      return !bannedKeys.some((blocked) => normalized.includes(blocked))
    }),
  )
}

async function sendGoHighLevelWebhook(eventName: string, payload: IntegrationPayload) {
  const config = getGoHighLevelConfig()

  if (!config.isConfigured) {
    console.log(`[gohighlevel] Webhook not configured. Skipping: ${eventName}`)
    return { ok: true, skipped: true }
  }

  try {
    const safePayload = scrubSensitiveFields(payload)
    console.log(`[gohighlevel] Sending webhook: ${eventName}`)

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.sourceToken ? { Authorization: `Token ${config.sourceToken}` } : {}),
      },
      body: JSON.stringify({
        event: eventName,
        timestamp: new Date().toISOString(),
        locationId: config.locationId || null,
        source: 'thegreenlist',
        data: safePayload,
      }),
    })

    if (!response.ok) {
      console.error(`[gohighlevel] Webhook failed: ${response.statusText}`)
      return { ok: false, status: response.status }
    }

    console.log(`[gohighlevel] Webhook sent: ${eventName}`)
    return { ok: true }
  } catch (error) {
    console.error(
      `[gohighlevel] Webhook error: ${error instanceof Error ? error.message : String(error)}`,
    )
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
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
