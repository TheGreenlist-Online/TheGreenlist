const BASE_URL = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '')

const checks = [
  { route: '/', expect: ({ status }) => status === 200 },
  { route: '/auth/signin', expect: ({ status }) => status === 200 },
  { route: '/auth/register', expect: ({ status }) => status === 200 },
  {
    route: '/dashboard',
    expect: ({ status, redirectTarget }) =>
      status === 200 || Boolean(redirectTarget?.includes('/auth/signin')),
  },
  { route: '/api/auth/session', expect: ({ status, contentType }) => status === 200 && contentType.includes('application/json') },
]

async function checkRoute({ route, expect }) {
  const startedAt = performance.now()
  let status = 0
  let redirectTarget = ''
  let contentType = ''
  let error = ''

  try {
    const response = await fetch(`${BASE_URL}${route}`, { redirect: 'manual' })
    status = response.status
    redirectTarget = response.headers.get('location') ?? ''
    contentType = response.headers.get('content-type') ?? ''
  } catch (caughtError) {
    error = caughtError instanceof Error ? caughtError.message : 'Unknown request failure'
  }

  const responseTimeMs = Math.round(performance.now() - startedAt)
  const passed = !error && expect({ status, redirectTarget, contentType })

  return {
    route,
    status,
    redirectTarget,
    responseTimeMs,
    result: passed ? 'pass' : 'fail',
    ...(error ? { error } : {}),
  }
}

const results = []

for (const check of checks) {
  results.push(await checkRoute(check))
}

console.table(results)

const failures = results.filter((result) => result.result === 'fail')

if (failures.length > 0) {
  process.exitCode = 1
}
