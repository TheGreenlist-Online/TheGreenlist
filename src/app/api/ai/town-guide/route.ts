import { asUntrustedContent } from '@/lib/ai/prompts'
import { createAiRoute, createAiStatusRoute } from '@/lib/ai/route-handler'
import { townGuideOutputSchema, townGuideRequestSchema } from '@/lib/ai/schemas'
import { findLocationByStandardPath, findLocationByTownPath } from '@/config/town-locations'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const GET = createAiStatusRoute('town-guide')

export const POST = createAiRoute({
  feature: 'town-guide',
  requestSchema: townGuideRequestSchema,
  outputSchema: townGuideOutputSchema,
  outputSchemaName: 'town_guide_answer',
  inputClassification: 'public_query',
  outputClassification: 'public_navigation',
  humanReviewRequired: false,
  async buildInput(request, principal) {
    const currentLocation = request.currentPath
      ? (findLocationByTownPath(request.currentPath) ?? findLocationByStandardPath(request.currentPath))
      : null

    const context = [
      `Visitor is ${principal.isAuthenticated ? 'signed in' : 'not signed in'}.`,
      currentLocation
        ? `They are currently at "${currentLocation.name}" (${currentLocation.district}).`
        : 'Their current location is unknown.',
      'Call getTownDestination before naming any destination so every link you return is real.',
    ].join(' ')

    return {
      input: [
        { role: 'developer', content: context },
        ...(request.history ?? []).map((turn) => ({
          role: turn.role,
          content:
            turn.role === 'user'
              ? asUntrustedContent('previous visitor message', turn.content)
              : turn.content,
        })),
        { role: 'user', content: asUntrustedContent('visitor question', request.message) },
      ],
      records: currentLocation ? [{ recordType: 'town_location', recordId: currentLocation.id }] : [],
    }
  },
})
