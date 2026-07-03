/**
 * n8n Integration Framework
 * 
 * This module provides a safe integration point for future n8n automation workflows.
 * It is optional and does not require configuration for the site to function.
 * 
 * Supported workflows:
 * - Moderation alerts
 * - Report notifications
 * - Content review
 * - Evidence review
 * - User onboarding
 * - Email campaigns
 */

function getN8nConfig() {
  const webhookUrl = (process.env.N8N_WEBHOOK_URL || '').trim()
  const apiKey = (process.env.N8N_API_KEY || '').trim()

  return {
    webhookUrl,
    apiKey,
    isConfigured: !!(webhookUrl && apiKey && !webhookUrl.startsWith('replace-') && !apiKey.startsWith('replace-')),
  }
}

async function sendN8nWebhook(
  workflowName: string,
  data: Record<string, unknown>,
) {
  const config = getN8nConfig()

  if (!config.isConfigured) {
    console.log(`[n8n] Webhook not configured. Skipping: ${workflowName}`)
    return { ok: true, skipped: true }
  }

  try {
    console.log(`[n8n] Sending webhook: ${workflowName}`)

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': config.apiKey,
      },
      body: JSON.stringify({
        workflow: workflowName,
        timestamp: new Date().toISOString(),
        data,
      }),
    })

    if (!response.ok) {
      console.error(`[n8n] Webhook failed: ${response.statusText}`)
      return { ok: false, status: response.status }
    }

    console.log(`[n8n] Webhook sent: ${workflowName}`)
    return { ok: true }
  } catch (error) {
    console.error(`[n8n] Webhook error: ${error instanceof Error ? error.message : String(error)}`)
    return { ok: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

// Export webhook triggers for future workflows
export const n8n = {
  isConfigured: () => getN8nConfig().isConfigured,
  config: getN8nConfig,
  send: sendN8nWebhook,

  // Workflow trigger helpers
  reportSubmitted: (reportId: string, userId: string) =>
    sendN8nWebhook('report-submitted', { reportId, userId }),

  evidenceUploaded: (reportId: string, userId: string) =>
    sendN8nWebhook('evidence-uploaded', { reportId, userId }),

  forumPostCreated: (postId: string, userId: string) =>
    sendN8nWebhook('forum-post-created', { postId, userId }),

  contentSubmitted: (contentId: string, userId: string) =>
    sendN8nWebhook('content-submitted', { contentId, userId }),

  moderationFlagged: (contentId: string, reason: string) =>
    sendN8nWebhook('moderation-flagged', { contentId, reason }),

  userSignup: (userId: string, email: string) =>
    sendN8nWebhook('user-signup', { userId, email }),
}
