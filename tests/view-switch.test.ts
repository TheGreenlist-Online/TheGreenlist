import { describe, expect, it } from 'vitest'
import { getCounterpartPath, getCurrentView, getSwitchLabel, resolveLocation } from '@/lib/view-switch'
import { TOWN_LOCATIONS } from '@/config/town-locations'

describe('getCurrentView', () => {
  it('treats /town and its descendants as the town view', () => {
    expect(getCurrentView('/town')).toBe('town')
    expect(getCurrentView('/town/forum-hall')).toBe('town')
  })

  it('does not mistake a lookalike prefix for the town view', () => {
    expect(getCurrentView('/townhall')).toBe('standard')
    expect(getCurrentView('/reports')).toBe('standard')
  })
})

describe('getCounterpartPath', () => {
  it('maps the standard landing page to the town square', () => {
    expect(getCounterpartPath('/')).toBe('/town')
    expect(getCounterpartPath('/town')).toBe('/')
  })

  it('maps a standard index to its town location', () => {
    expect(getCounterpartPath('/forums')).toBe('/town/forum-hall')
    expect(getCounterpartPath('/reports')).toBe('/town/transparency-archives')
  })

  it('carries the query string and hash across the switch', () => {
    expect(getCounterpartPath('/businesses?status=verified&page=2#results')).toBe(
      '/town/business-district?status=verified&page=2#results',
    )
  })

  it('merges a query already declared on the location href', () => {
    expect(getCounterpartPath('/town/cultivator-grove?page=3')).toBe('/businesses?role=CULTIVATOR&page=3')
  })

  it('deep-links an open record into the town view', () => {
    expect(getCounterpartPath('/reports/abc-123')).toBe('/town/transparency-archives?record=abc-123')
  })

  it('turns the town record param back into a path segment', () => {
    expect(getCounterpartPath('/town/transparency-archives?record=abc-123')).toBe('/reports/abc-123')
  })

  it('round-trips a record without losing unrelated query state', () => {
    const standard = '/reports/abc-123?tab=evidence'
    const town = getCounterpartPath(standard)
    expect(town).toBe('/town/transparency-archives?tab=evidence&record=abc-123')
    expect(getCounterpartPath(town)).toBe('/reports/abc-123?tab=evidence')
  })

  it('percent-encodes a record id that would otherwise break the query', () => {
    expect(getCounterpartPath('/reports/a b&c')).toBe('/town/transparency-archives?record=a%20b%26c')
  })

  it('falls back to a live root rather than producing a dead link', () => {
    expect(getCounterpartPath('/some/unmapped/page')).toBe('/town')
    expect(getCounterpartPath('/town/not-a-real-location')).toBe('/')
  })

  it('never returns an empty path', () => {
    for (const path of ['/', '/town', '/forums', '/admin', '/unknown', '/town/unknown']) {
      expect(getCounterpartPath(path).startsWith('/')).toBe(true)
    }
  })
})

describe('resolveLocation', () => {
  it('prefers the longest matching standard prefix', () => {
    // '/report' and '/reports' both prefix-match '/reports'; the longer wins.
    expect(resolveLocation('/reports')?.id).toBe('transparency-archives')
    expect(resolveLocation('/report')?.id).toBe('report-office')
  })

  it('resolves town paths through the location id', () => {
    expect(resolveLocation('/town/watchtower')?.id).toBe('watchtower')
    expect(resolveLocation('/town')?.id).toBe('town-square')
  })

  it('returns null for a path with no location', () => {
    expect(resolveLocation('/nothing-here')).toBeNull()
  })
})

describe('getSwitchLabel', () => {
  it('names the destination, not the current view', () => {
    expect(getSwitchLabel('town')).toBe('Standard View')
    expect(getSwitchLabel('standard')).toBe('Town View')
  })
})

describe('every town location is reachable from its own standard route', () => {
  it.each(TOWN_LOCATIONS.filter((location) => location.standardPrefixes.length > 0).map((l) => [l.id, l] as const))(
    '%s',
    (_id, location) => {
      expect(getCounterpartPath(location.standardHref)).toContain(location.townHref)
    },
  )
})
