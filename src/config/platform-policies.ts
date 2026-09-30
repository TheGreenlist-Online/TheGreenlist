/**
 * Public, quotable statements of platform rules.
 *
 * This is the authoritative text the AI Town Guide is allowed to paraphrase
 * when a user asks "how does verification work?" or "can a business pay to
 * remove a report?". Keeping it in config rather than in a prompt string means
 * the same wording is used by the AI, the help pages, and future policy UI.
 *
 * Everything here is public by definition. Never add internal or unpublished
 * policy to this file.
 */

export type PlatformPolicy = Readonly<{
  id: string
  title: string
  summary: string
  standardHref: string
  points: readonly string[]
}>

export const PLATFORM_POLICIES: readonly PlatformPolicy[] = [
  {
    id: 'transparency-cannot-be-purchased',
    title: 'Transparency cannot be purchased',
    summary:
      'Paid subscriptions buy tools, storage and customization. They never buy reputation, verification, or the removal of public records.',
    standardHref: '/legal',
    points: [
      'Businesses may purchase tools, storage, customization and digital property features.',
      'Businesses may never purchase favourable reputation, report removal, moderation outcomes or verification status.',
      'Critical public transparency information is never hidden because someone did not pay.',
      'There are no pay-to-win mechanics, gambling mechanics, or speculative token economies.',
    ],
  },
  {
    id: 'privacy-defaults',
    title: 'Privacy is not secrecy',
    summary:
      'Personal profiles are private by default. Residents opt in, field by field, to anything shown publicly.',
    standardHref: '/legal/privacy',
    points: [
      'Personal profiles are private by default and controlled by the resident.',
      'Legal name, email, phone number, precise location, IP address, private messages, moderation history and payment details are never displayed by default.',
      'Anonymous reporters are never identified, to anyone, through any platform feature.',
      'Private evidence files are never exposed through search, summaries, or AI features.',
    ],
  },
  {
    id: 'report-statuses',
    title: 'Report statuses and what they mean',
    summary:
      'A report is an allegation until the platform has reviewed it. The status label is the only claim the platform makes.',
    standardHref: '/reports',
    points: [
      'Pending Review — submitted, not yet assessed.',
      'Under Review — actively being assessed by human reviewers.',
      'Verified — the platform reviewed supporting evidence and considers the core claim substantiated.',
      'Unverified — reviewed without sufficient supporting evidence. This is not a finding of innocence or guilt.',
      'Escalated — referred for legal or senior review.',
      'Resolved — the matter has concluded, including any business response.',
      'An allegation is never presented as an established fact.',
    ],
  },
  {
    id: 'verification-status',
    title: 'Verification status',
    summary:
      'Verification records a documentation check performed by humans. It is not an endorsement and cannot be bought.',
    standardHref: '/legal',
    points: [
      'Unverified — no documentation has been reviewed.',
      'Pending — documentation has been submitted and is awaiting human review.',
      'Verified — identity and licence documentation were reviewed and matched by a human reviewer.',
      'Verification is not a quality rating, a safety guarantee, or a legal compliance certification.',
      'Verification status cannot be purchased, expedited by payment, or granted by an AI system.',
    ],
  },
  {
    id: 'ai-assistance',
    title: 'How AI is used here',
    summary: 'AI assists people. It never silently makes an irreversible decision.',
    standardHref: '/legal',
    points: [
      'AI output is labelled as AI-generated wherever it appears.',
      'AI can recommend a moderation outcome, but only an accountable human can act on it.',
      'AI never bans an account, deletes evidence, removes a report, publishes a private report, changes a verified status, or resolves an appeal.',
      'AI features read only records the requesting user is already permitted to read.',
      'Every AI request is recorded in an audit trail that stores metadata, not private content.',
      'Incorrect AI output can be reported for human review.',
    ],
  },
  {
    id: 'no-commerce',
    title: 'No cannabis commerce',
    summary:
      'The Green List is a transparency and accountability platform. It carries no commerce of any kind.',
    standardHref: '/legal/terms',
    points: [
      'No cannabis sales, product ordering, checkout, or payment for cannabis.',
      'No delivery coordination, inventory, sales menus, or dispensary transaction tools.',
      'Business profiles are trust and transparency assets, never storefronts.',
      'The platform does not provide medical, health, efficacy, or legal advice.',
    ],
  },
] as const

const POLICIES_BY_ID = new Map(PLATFORM_POLICIES.map((policy) => [policy.id, policy]))

export function getPlatformPolicy(id: string): PlatformPolicy | null {
  return POLICIES_BY_ID.get(id) ?? null
}

export function searchPlatformPolicies(query: string, limit = 3): readonly PlatformPolicy[] {
  const terms = query
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((term) => term.length > 2)

  if (terms.length === 0) return PLATFORM_POLICIES.slice(0, limit)

  return PLATFORM_POLICIES.map((policy) => {
    const haystack = `${policy.title} ${policy.summary} ${policy.points.join(' ')}`.toLowerCase()
    const score = terms.reduce((total, term) => (haystack.includes(term) ? total + 1 : total), 0)
    return { policy, score }
  })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.policy)
}
