import { z } from 'zod'
import {
  PLATFORM_POLICIES,
  getPlatformPolicy,
  searchPlatformPolicies,
} from '@/config/platform-policies'
import { getReachableTownLocations, getTownLocation } from '@/config/town-locations'
import type { AiTool } from './types'

/**
 * Tools backed by static platform configuration rather than the database.
 *
 * These never touch Supabase, so they always work — including during a build,
 * in a preview environment with no database, and for anonymous visitors. They
 * are what lets the Town Guide stay useful when data tools degrade.
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
    'Use whenever a user asks whether a business is trustworthy, verified, or licensed.',
  inputSchema: z.object({}),
  async execute() {
    const policy = getPlatformPolicy('verification-status')
    return {
      result: {
        statuses: policy?.points ?? [],
        summary: policy?.summary ?? '',
        caution:
          'Verification is a documentation check performed by humans. It is not an endorsement, a safety guarantee, or proof of legal compliance, and it can never be purchased.',
        standardHref: policy?.standardHref ?? '/legal',
      },
      records: [{ recordType: 'policy', recordId: 'verification-status' }],
    }
  },
}

export const getTownDestination: AiTool<{ topic: string }, unknown> = {
  name: 'getTownDestination',
  description:
    'Find where in Green List Town, and at which standard-site route, a topic lives. ' +
    'Always call this before recommending a destination so the links you return are real.',
  inputSchema: z.object({
    topic: z
      .string()
      .trim()
      .min(2)
      .max(200)
      .describe('What the user wants to do, e.g. "file a report", "check a licence", "read the rules".'),
  }),
  async execute({ principal }, input) {
    const reachable = getReachableTownLocations(principal.isAuthenticated)
    const terms = input.topic
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((term) => term.length > 2)

    const scored = reachable
      .map((location) => {
        const haystack =
          `${location.name} ${location.district} ${location.description} ${location.tagline} ${location.guideNotes}`.toLowerCase()
        const score = terms.reduce((total, term) => (haystack.includes(term) ? total + 1 : total), 0)
        return { location, score }
      })
      .sort((a, b) => b.score - a.score)

    const matched = scored.filter((entry) => entry.score > 0).slice(0, 4)
    const results = matched.length > 0 ? matched : scored.slice(0, 3)

    return {
      result: {
        destinations: results.map(({ location }) => ({
          id: location.id,
          title: location.name,
          district: location.district,
          standardHref: location.standardHref,
          townHref: location.townHref,
          description: location.description,
          access: location.access,
          guidance: location.guideNotes,
        })),
        note: principal.isAuthenticated
          ? 'Role-restricted locations are excluded from these results.'
          : 'This visitor is not signed in. Locations requiring an account are excluded; mention signing in if relevant.',
      },
      records: results.map(({ location }) => ({
        recordType: 'town_location',
        recordId: location.id,
      })),
    }
  },
}

export const getTownLocationDetail: AiTool<{ locationId: string }, unknown> = {
  name: 'getTownLocationDetail',
  description: 'Fetch full details for one town location by its id.',
  inputSchema: z.object({
    locationId: z.string().trim().min(2).max(64).describe('The town location id, e.g. "report-office".'),
  }),
  async execute(_context, input) {
    const location = getTownLocation(input.locationId)

    if (!location) {
      return { result: { found: false, note: 'No town location with that id.' } }
    }

    return {
      result: {
        found: true,
        id: location.id,
        name: location.name,
        district: location.district,
        description: location.description,
        standardHref: location.standardHref,
        townHref: location.townHref,
        access: location.access,
        visibility: location.visibility,
        guidance: location.guideNotes,
      },
      records: [{ recordType: 'town_location', recordId: location.id }],
    }
  },
}

export const PLATFORM_TOOLS = [
  getPublicPlatformPolicy,
  getVerificationExplanation,
  getTownDestination,
  getTownLocationDetail,
] as const
