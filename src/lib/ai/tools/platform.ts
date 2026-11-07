import { z } from 'zod'
import {
  PLATFORM_POLICIES,
  getPlatformPolicy,
  searchPlatformPolicies,
} from '@/config/platform-policies'
import { PRIMARY_NAV } from '@/config/navigation'
import type { AiTool } from './types'

/**
 * Tools backed by static platform configuration rather than the database.
 *
 * These never touch Supabase, so they always work — including during a build,
 * in a preview environment with no database, and for anonymous visitors.
 */

export const getPublicPlatformPolicy: AiTool<{ query: string }, unknown> = {
  name: 'getPublicPlatformPolicy',
  description:
    'Look up published platform rules: what subscriptions can and cannot buy, privacy defaults, report statuses, ' +
    'how AI is used, and the no-commerce boundary. Use this before answering any question about platform rules.',
  inputSchema: z.object({
    query: z.string().trim().min(2).max(200).describe('What the user wants to know about the rules.'),
  }),
  async execute(_context, input) {
    const matches = searchPlatformPolicies(input.query)
    const policies = matches.length > 0 ? matches : PLATFORM_POLICIES.slice(0, 2)

    return {
      result: {
        policies: policies.map((policy) => ({
          id: policy.id,
          title: policy.title,
          summary: policy.summary,
          points: policy.points,
          standardHref: policy.standardHref,
        })),
      },
      records: policies.map((policy) => ({ recordType: 'policy', recordId: policy.id })),
    }
  },
}

export const getVerificationExplanation: AiTool<Record<string, never>, unknown> = {
  name: 'getVerificationExplanation',
  description:
    'Explain what each verification status means and what verification does and does not guarantee. ' +
    'Use whenever a user asks what a business verification status means.',
  inputSchema: z.object({}),
  async execute() {
    const policy = getPlatformPolicy('verification-status')
    return {
      result: {
        statuses: policy?.points ?? [],
        summary: policy?.summary ?? '',
        caution:
          'The platform does not record licensing status. Verification is not an endorsement, a safety guarantee, or proof of legal compliance, and it can never be purchased.',
        standardHref: policy?.standardHref ?? '/legal',
      },
      records: [{ recordType: 'policy', recordId: 'verification-status' }],
    }
  },
}

export const getRecordsDestination: AiTool<{ topic: string }, unknown> = {
  name: 'getRecordsDestination',
  description:
    'Find an existing records-based site section for a topic. ' +
    'Always call this before recommending a destination so the links you return are real.',
  inputSchema: z.object({
    topic: z
      .string()
      .trim()
      .min(2)
      .max(200)
      .describe('What the user wants to do, e.g. "find a report", "look up a business", "read the rules".'),
  }),
  async execute(_context, input) {
    const terms = input.topic
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length > 2)

    const scored = PRIMARY_NAV
      .map((section) => {
        const haystack = `${section.label} ${section.purpose} ${section.href}`.toLowerCase()
        const score = terms.reduce((total, term) => (haystack.includes(term) ? total + 1 : total), 0)
        return { section, score }
      })
      .sort((a, b) => b.score - a.score)

    const matched = scored.filter((entry) => entry.score > 0).slice(0, 4)
    const results = matched.length > 0 ? matched : scored.slice(0, 3)

    return {
      result: {
        destinations: results.map(({ section }) => ({
          title: section.label,
          standardHref: section.href,
          description: section.purpose,
        })),
        note: 'These are public section links. Protected records still require the appropriate account and role.',
      },
      records: results.map(({ section }) => ({
        recordType: 'site_section',
        recordId: section.href,
      })),
    }
  },
}

export const PLATFORM_TOOLS = [
  getPublicPlatformPolicy,
  getVerificationExplanation,
  getRecordsDestination,
] as const
