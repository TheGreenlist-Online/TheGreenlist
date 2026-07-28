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
      .select('id, owner_id, name, state, city, verification_status, sponsorship_status, is_claimed, created_at')
      .eq('id', request.businessId)
      .maybeSingle()

    if (error) {
      throw new AiError('upstream_error', 'That business profile could not be read right now.', { cause: error })
    }

    if (!business) {
      throw new AiError('forbidden', 'That business profile is not available.')
    }

    // Public report history only. Reports link to a business by foreign key,
    // so this is an exact association rather than a name match. Anonymous
    // reports are excluded here as well as by RLS, and report descriptions are
    // never selected.
    const { data: reports } = await principal.supabase
      .from('reports')
      .select('id, title, report_type, status, verification_status, created_at')
      .eq('business_id', business.id)
      .eq('is_anonymous', false)
      .order('created_at', { ascending: false })
      .limit(MAX_REPORTS)

    const reportHistory = reports ?? []

    const publicRecord = [
      `Business name: ${business.name}`,
      `Location: ${[business.city, business.state].filter(Boolean).join(', ') || 'not disclosed'}`,
      `Verification status: ${business.verification_status ?? 'unverified'}`,
      `Sponsorship status: ${business.sponsorship_status ?? 'none'}`,
      `Profile claimed by owner: ${business.is_claimed ? 'yes' : 'no'}`,
      `Listed since: ${business.created_at ?? 'unknown'}`,
      '',
      reportHistory.length > 0
        ? `Public reports (${reportHistory.length}):\n` +
          reportHistory
            .map(
              (report) =>
                `- [${report.status}/${report.verification_status ?? 'unverified'}] ${report.title} (${report.report_type ?? 'uncategorised'})`,
            )
            .join('\n')
        : 'Public reports: none on record.',
    ].join('\n')

    const isOwner = principal.user?.id != null && principal.user.id === business.owner_id

    const instructions = [
      'Explain what this public record shows.',
      isOwner
        ? 'The requester owns this business, so also help them prepare stronger disclosures.'
        : 'The requester is a member of the public.',
      request.question ? `They asked: ${request.question}` : '',
      'Do not produce a score, grade, rating or ranking of any kind.',
      'Licence details are not tracked on this record. Never state or imply whether the business is licensed.',
      'Sponsorship is a paid placement and says nothing about conduct. Never treat it as a mark of trustworthiness.',
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
