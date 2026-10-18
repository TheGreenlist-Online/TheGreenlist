import assert from 'node:assert/strict'
import { test } from 'node:test'
import { redactAnalyticsEvent } from '../src/lib/analytics-privacy.ts'

test('analytics removes all query and fragment data', () => {
  assert.deepEqual(redactAnalyticsEvent({ type: 'event', url: 'https://example.test/businesses/claim?email=private@example.test#token' }), {
    type: 'event', url: 'https://example.test/businesses/claim',
  })
})
test('private and identifying paths are never sent', () => {
  for (const path of ['/reports/123', '/profile/alice', '/auth/confirm', '/admin', '/evidence/upload', '/dashboard', '/businesses/private-org']) {
    assert.equal(redactAnalyticsEvent({ type: 'pageview', url: `https://example.test${path}` }), null)
  }
  assert.equal(redactAnalyticsEvent({ type: 'pageview', url: 'not a URL' }), null)
})
