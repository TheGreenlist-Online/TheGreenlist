import { asUntrustedContent } from '@/lib/ai/prompts'
import { createAiRoute, createAiStatusRoute } from '@/lib/ai/route-handler'
import { recordsGuideOutputSchema, recordsGuideRequestSchema } from '@/lib/ai/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = createAiStatusRoute('records-guide')

export const POST = createAiRoute({
  feature: 'records-guide',
  requestSchema: recordsGuideRequestSchema,
  outputSchema: recordsGuideOutputSchema,
  outputSchemaName: 'records_guide_answer',
  inputClassification: 'public_query',
  outputClassification: 'public_navigation',
  humanReviewRequired: false,
  async buildInput(request) {
    const instructions =
      'Use getRecordsDestination before recommending a site section. Use public-record tools to ground specific claims. ' +
      'Never guess a route or state that a private record was reviewed.'

    return {
      input: [
        { role: 'developer', content: instructions },
        ...(request.currentPath
          ? [{ role: 'user' as const, content: asUntrustedContent('current page path', request.currentPath) }]
          : []),
        ...(request.history ?? []).map((turn) => ({
          role: 'user' as const,
          content: asUntrustedContent(`previous ${turn.role} turn`, turn.content),
        })),
        { role: 'user', content: asUntrustedContent('reader question', request.message) },
      ],
      records: [],
    }
  },
})
