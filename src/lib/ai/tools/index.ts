import type { AiFeature } from '../config'
import type { AiTool } from './types'
import { PLATFORM_TOOLS } from './platform'
import { PUBLIC_DATA_TOOLS } from './public-data'

/**
 * Per-feature tool allow-lists.
 *
 * A feature can only ever call the tools named here. There is no dynamic tool
 * registration and no way for a model to request a tool outside its list.
 */

export * from './types'
export * from './platform'
export * from './public-data'

const ALL_TOOLS: readonly AiTool[] = [...PLATFORM_TOOLS, ...PUBLIC_DATA_TOOLS] as readonly AiTool[]

function pick(names: readonly string[]): readonly AiTool[] {
  return names.map((name) => {
    const tool = ALL_TOOLS.find((candidate) => candidate.name === name)
    if (!tool) throw new Error(`Unknown AI tool: ${name}`)
    return tool
  })
}

const FEATURE_TOOLS: Readonly<Record<AiFeature, readonly AiTool[]>> = {
  'town-guide': pick([
    'getTownDestination',
    'getTownLocationDetail',
    'getPublicPlatformPolicy',
    'getVerificationExplanation',
    'searchPublicBusinesses',
    'searchPublicReports',
    'searchPublicForumThreads',
    'searchEducationResources',
  ]),
  'forum-summary': pick(['getPublicPlatformPolicy', 'searchPublicReports']),
  // The report assistant works only from the user's own draft. Giving it data
  // tools would let a draft's contents pull in unrelated records.
  'report-assistant': pick(['getPublicPlatformPolicy']),
  'moderation-review': pick(['getPublicPlatformPolicy']),
  'business-transparency': pick([
    'getPublicBusinessProfile',
    'searchPublicReports',
    'getVerificationExplanation',
    'getPublicPlatformPolicy',
  ]),
}

export function getToolsForFeature(feature: AiFeature): readonly AiTool[] {
  return FEATURE_TOOLS[feature]
}

export function findTool(feature: AiFeature, name: string): AiTool | null {
  return getToolsForFeature(feature).find((tool) => tool.name === name) ?? null
}
