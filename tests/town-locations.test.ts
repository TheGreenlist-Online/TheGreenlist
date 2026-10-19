import { describe, expect, it } from 'vitest'
import {
  TOWN_DISTRICTS,
  TOWN_LOCATIONS,
  getReachableTownLocations,
  getTownLocation,
} from '@/config/town-locations'

describe('town location config integrity', () => {
  it('has unique ids', () => {
    const ids = TOWN_LOCATIONS.map((location) => location.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique town hrefs', () => {
    const hrefs = TOWN_LOCATIONS.map((location) => location.townHref)
    expect(new Set(hrefs).size).toBe(hrefs.length)
  })

  it('derives every town href from the location id', () => {
    for (const location of TOWN_LOCATIONS) {
      if (location.townHref === '/town') continue
      expect(location.townHref).toBe(`/town/${location.id}`)
    }
  })

  it('points every location at an absolute standard route', () => {
    for (const location of TOWN_LOCATIONS) {
      expect(location.standardHref.startsWith('/')).toBe(true)
    }
  })

  it('declares standard prefixes as absolute paths without a trailing slash', () => {
    for (const location of TOWN_LOCATIONS) {
      for (const prefix of location.standardPrefixes) {
        expect(prefix.startsWith('/')).toBe(true)
        expect(prefix.endsWith('/')).toBe(false)
      }
    }
  })

  it('never assigns the same standard prefix to two locations', () => {
    const prefixes = TOWN_LOCATIONS.flatMap((location) => location.standardPrefixes)
    expect(new Set(prefixes).size).toBe(prefixes.length)
  })

  it('gives the AI guide notes for every location', () => {
    for (const location of TOWN_LOCATIONS) {
      expect(location.guideNotes.length).toBeGreaterThan(20)
    }
  })

  it('lists each district exactly once', () => {
    expect(new Set(TOWN_DISTRICTS).size).toBe(TOWN_DISTRICTS.length)
    for (const location of TOWN_LOCATIONS) {
      expect(TOWN_DISTRICTS).toContain(location.district)
    }
  })
})

describe('getTownLocation', () => {
  it('resolves a known id and rejects an unknown one', () => {
    expect(getTownLocation('watchtower')?.name).toBe('The Watchtower')
    expect(getTownLocation('does-not-exist')).toBeNull()
  })
})

describe('getReachableTownLocations', () => {
  it('never offers a role-restricted location to anyone', () => {
    for (const isAuthenticated of [false, true]) {
      const reachable = getReachableTownLocations(isAuthenticated)
      expect(reachable.some((location) => location.access === 'role-restricted')).toBe(false)
    }
  })

  it('withholds resident-only locations from anonymous visitors', () => {
    const anonymous = getReachableTownLocations(false)
    expect(anonymous.some((location) => location.access === 'authenticated')).toBe(false)
    expect(anonymous.some((location) => location.id === 'report-office')).toBe(false)
  })

  it('offers resident-only locations once signed in', () => {
    const signedIn = getReachableTownLocations(true)
    expect(signedIn.some((location) => location.id === 'report-office')).toBe(true)
    expect(signedIn.some((location) => location.id === 'resident-base')).toBe(true)
  })
})
