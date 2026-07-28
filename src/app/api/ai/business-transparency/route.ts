import { AiError } from '@/lib/ai/errors'
import { asUntrustedContent } from '@/lib/ai/prompts'
import { createAiRoute, createAiStatusRoute } from '@/lib/ai/route-handler'
import { businessTransparencyOutputSchema, businessTransparencyRequestSchema } from '@/lib/ai/schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_REPORTS = 15

export const GET = createAiStatusRoute('business-transparency')

export const POST = createAiRoute({
  feature: 'business-transparency',
  requestSchema: businessTransparencyRequestSchema,
  outputSchema: businessTransparencyOutputSchema,
  outputSchemaName: 'business_transparency_review',
  inputClassification: 'public_record',
  outputClassification: 'public_summary',
  humanReviewRequired: false,
  async buildInput(request, principal) {
    const { data: business, error } = await principal.supabase
      .from('business_profiles')
      .select('id, business_name, license_number, license_state, verification_status, created_at')
      .eq('id', request.businessId)
      .maybeSingle()

    if (error) {
      throw new AiError('upstream_error', 'That business profile could not be read right now.', { cause: error })
    }

    if (!business) {
      throw new AiError('forbidden', 'That business profile is not available.')
    }

    // Public report history only. Anonymous reports are excluded here as well
    // as by RLS, and report descriptions are never selected.
    const { data: reports } = await principal.supabase
      .from('reports')
      .select('id, title, category, status, created_at')
      .eq('is_anonymous', false)
      .ilike('business_name', business.business_name)
      .order('created_at', { ascending: false })
      .limit(MAX_REPORTS)

    const reportHistory = reports ?? []

    const publicRecord = [
      `Business name: ${business.business_name}`,
      `Verification status: ${business.verification_status ?? 'unverified'}`,
      `Licence number on file: ${business.license_number ? 'yes' : 'no'}`,
      `Licence state: ${business.license_state ?? 'not disclosed'}`,
      `Listed since: ${business.created_at ?? 'unknown'}`,
      '',
      reportHistory.length > 0
        ? `Public reports (${reportHistory.length}):\n` +
          reportHistory
            .map((report) => `- [${report.status}] ${report.title} (${report.category ?? 'uncategorised'})`)
            .join('\n')
        : 'Public reports: none on record.',
    ].join('\n')

    const isOwner = principal.user?.id != null && principal.user.id === (business as { owner_user_id?: string }).owner_user_id

    const instructions = [
      'Explain what this public record shows.',
      isOwner
        ? 'The requester owns this business, so also help them prepare stronger disclosures.'
        : 'The requester is a member of the public.',
      request.question ? `They asked: ${request.question}` : '',
      'Do not produce a score, grade, rating or ranking of any kind.',
      'Absence of reports is not proof of good conduct; an unverified report is not proof of wrongdoing. Say so where relevant.',
    ]
      .filter(Boolean)
      .join(' ')

    return {
      input: [
        { role: 'developer', content: instructions },
        { role: 'user', content: asUntrustedContent(`business public record ${business.id}`, publicRecord) },
      ],
      records: [
        { recordType: 'business_profile', recordId: String(business.id) },
        ...reportHistory.map((report) => ({ recordType: 'report', recordId: String(report.id) })),
      ],
    }
  },
})
