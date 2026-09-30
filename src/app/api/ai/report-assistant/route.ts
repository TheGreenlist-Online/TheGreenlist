import { asUntrustedContent } from '@/lib/ai/prompts'
import { createAiRoute, createAiStatusRoute } from '@/lib/ai/route-handler'
import { reportAssistantOutputSchema, reportAssistantRequestSchema } from '@/lib/ai/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = createAiStatusRoute('report-assistant')

/**
 * Helps a reporter organise their own unsaved draft.
 *
 * Privacy design: the draft is supplied in the request body and is never read
 * from, or written to, the database. No `report_id` is accepted, so this route
 * structurally cannot reach another user's report. Evidence files are never
 * sent — only the draft text the user typed, and only after explicit consent
 * (`consentToProcess`). Nothing here files the report; submission remains a
 * separate, explicit user action.
 */
export const POST = createAiRoute({
  feature: 'report-assistant',
  requestSchema: reportAssistantRequestSchema,
  outputSchema: reportAssistantOutputSchema,
  outputSchemaName: 'report_draft_analysis',
  inputClassification: 'user_owned_draft',
  outputClassification: 'user_private_assistance',
  humanReviewRequired: false,
  async buildInput(request) {
    const instructions = [
      'The reporter has NOT submitted this report. You are helping them prepare it.',
      request.category ? `They selected the category: ${request.category}.` : '',
      'Work strictly from the draft text. Never add a fact, date, name, quantity or location that is not already there.',
      'Anything absent belongs in missingFields, not in the chronology.',
      'Flag names, contact details, licence plates, account handles and precise addresses under sensitiveInformation.',
    ]
      .filter(Boolean)
      .join(' ')

    return {
      input: [
        { role: 'developer', content: instructions },
        { role: 'user', content: asUntrustedContent('reporter draft', request.draft) },
      ],
      // No records read: the draft never touches the database.
      records: [],
    }
  },
})
