/** Translate database-enforced quotas without exposing database details. */
export function writeQuotaResponse(error: unknown): Response | null {
  if (typeof error !== 'object' || error === null || !('code' in error) || error.code !== 'PT429') {
    return null
  }
  return new Response(JSON.stringify({ error: 'Submission limit reached. Try again after the next hourly reset.' }), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Retry-After': '3600',
    },
  })
}
