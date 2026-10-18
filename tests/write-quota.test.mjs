import assert from 'node:assert/strict'
import test from 'node:test'
import { writeQuotaResponse } from '../src/lib/write-quota.ts'

test('quota response returns 429 with the remaining hourly delay and hides database detail', async (context) => {
 context.mock.method(Date, 'now', () => Date.UTC(2026, 9, 12, 12, 59, 0))
 const response = writeQuotaResponse({code:'PT429',message:'private database detail'})
 assert.equal(response.status,429)
 assert.equal(response.headers.get('Retry-After'),'60')
 const text = await response.text()
 assert.equal(text.includes('private database detail'),false)
})
test('unrelated errors retain their existing handling', () => {
 for(const value of [null,undefined,'PT429',new Error('PT429'),{}, {code:'42501'}]) {
  assert.equal(writeQuotaResponse(value),null)
 }
})
