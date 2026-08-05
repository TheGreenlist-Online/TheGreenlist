import {
  findLocationByStandardPath,
  findLocationByTownPath,
  getTownLocation,
  type TownLocation,
} from '@/config/town-locations'

/**
 * Standard ⇄ Town view switching.
 *
 * Switching interface must not lose the user's place. Authentication and
 * permissions are unaffected (both interfaces are the same app, same session,
 * same RLS), so the only thing this layer has to preserve is *where you are*
 * and *what you were looking at*: the record id and the query state.
 *
 * The mapping is derived from `src/config/town-locations.ts` — the same single
 * source the map, the ribbon and the AI guide use.
 */

export type PlatformView = 'standard' | 'town'

export function getCurrentView(pathname: string): PlatformView {
  return pathname === '/town' || pathname.startsWith('/town/') ? 'town' : 'standard'
}

type ParsedUrl = { path: string; query: string; hash: string }

function parseUrl(url: string): ParsedUrl {
  const hashIndex = url.indexOf('#')
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex)
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex)

  const queryIndex = withoutHash.indexOf('?')
  return queryIndex === -1
    ? { path: withoutHash, query: '', hash }
    : { path: withoutHash.slice(0, queryIndex), query: withoutHash.slice(queryIndex + 1), hash }
}

function buildUrl(path: string, query: string, hash: string): string {
  // A location's standardHref may already carry a query (e.g. ?role=CULTIVATOR).
  const [basePath, baseQuery = ''] = path.split('?')
  const merged = [baseQuery, query].filter(Boolean).join('&')
  return `${basePath}${merged ? `?${merged}` : ''}${hash}`
}

/**
 * The record id trailing a location's standard route, e.g. `/reports/abc` in
 * the Transparency Archives yields `abc`. Returns null when the user is on the
 * location's index rather than a specific record.
 */
function getRecordSegment(pathname: string, location: TownLocation): string | null {
  for (const prefix of location.standardPrefixes) {
    if (pathname.startsWith(`${prefix}/`)) {
      const remainder = pathname.slice(prefix.length + 1)
      if (remainder) return remainder
    }
  }
  return null
}

/**
 * Resolve the equivalent path in the other interface.
 *
 * Query string and hash are always carried across so filters, search terms and
 * pagination survive the switch. When a record is open in the standard view,
 * the town equivalent deep-links to that same record via `?record=`, so the
 * town location page can show the record in context rather than dumping the
 * user at a district entrance.
 *
 * Returns the town/standard root when no specific mapping exists, so the
 * switcher never produces a dead link.
 */
export function getCounterpartPath(currentUrl: string): string {
  const { path, query, hash } = parseUrl(currentUrl)

  if (getCurrentView(path) === 'standard') {
    const location = findLocationByStandardPath(path)
    if (!location) return buildUrl('/town', query, hash)

    const record = getRecordSegment(path, location)
    const townQuery = record ? [query, `record=${encodeURIComponent(record)}`].filter(Boolean).join('&') : query

    return buildUrl(location.townHref, townQuery, hash)
  }

  const location = findLocationByTownPath(path)
  if (!location) return buildUrl('/', query, hash)

  // `record` is a town-side addressing detail; going back to the standard view
  // it becomes a real path segment again.
  const params = new URLSearchParams(query)
  const record = params.get('record')
  params.delete('record')

  const standardPath = record ? `${location.standardPrefixes[0] ?? location.standardHref}/${record}` : location.standardHref

  return buildUrl(standardPath, params.toString(), hash)
}

export function getSwitchLabel(view: PlatformView): string {
  return view === 'town' ? 'Standard View' : 'Town View'
}

/** The location a path belongs to in either interface, or null. */
export function resolveLocation(pathname: string): TownLocation | null {
  return getCurrentView(pathname) === 'town'
    ? findLocationByTownPath(pathname)
    : findLocationByStandardPath(pathname)
}

export { getTownLocation }
