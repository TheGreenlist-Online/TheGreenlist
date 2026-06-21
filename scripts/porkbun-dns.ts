/**
 * Porkbun DNS Configuration Script
 *
 * Manages DNS records for The Green List domains via the Porkbun API.
 *
 * Primary domain:
 *   thegreenlist.online
 *
 * Secondary / backup domain:
 *   greenlist.online
 *
 * This script does NOT hardcode Vercel DNS values.
 * Copy the exact A/CNAME values from your Vercel domain settings into .env.local.
 *
 * Required .env.local:
 *
 *   PORKBUN_API_KEY=
 *   PORKBUN_API_SECRET=
 *   PORKBUN_DOMAIN=thegreenlist.online
 *
 *   VERCEL_APEX_A_RECORD=
 *   VERCEL_WWW_CNAME_RECORD=
 *
 * Optional .env.local:
 *
 *   INCLUDE_API_SUBDOMAIN=false
 *   VERCEL_API_CNAME_RECORD=
 *
 * Commands:
 *
 *   npx ts-node scripts/porkbun-dns.ts list
 *   npx ts-node scripts/porkbun-dns.ts setup-vercel
 *   npx ts-node scripts/porkbun-dns.ts setup-vercel --apply
 *
 * Safety:
 *   setup-vercel is DRY RUN by default.
 *   Add --apply to actually delete/create DNS records.
 */

import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const PORKBUN_API_URL = 'https://api.porkbun.com/api/json/v3'

const API_KEY = process.env.PORKBUN_API_KEY
const API_SECRET = process.env.PORKBUN_API_SECRET
const DOMAIN = process.env.PORKBUN_DOMAIN

const VERCEL_APEX_A_RECORD = process.env.VERCEL_APEX_A_RECORD
const VERCEL_WWW_CNAME_RECORD = process.env.VERCEL_WWW_CNAME_RECORD
const VERCEL_API_CNAME_RECORD = process.env.VERCEL_API_CNAME_RECORD

const INCLUDE_API_SUBDOMAIN = process.env.INCLUDE_API_SUBDOMAIN === 'true'
const APPLY_CHANGES = process.argv.includes('--apply')

const VALID_DOMAINS = new Set(['thegreenlist.online', 'greenlist.online'])

type DNSRecordType =
  | 'A'
  | 'AAAA'
  | 'ALIAS'
  | 'CAA'
  | 'CNAME'
  | 'MX'
  | 'NS'
  | 'SRV'
  | 'TXT'

interface DesiredDNSRecord {
  type: DNSRecordType
  name: string
  content: string
  ttl?: number
  priority?: number
}

interface PorkbunDNSRecord {
  id: string
  name: string
  type: DNSRecordType
  content: string
  ttl?: string | number
  prio?: string | number
  priority?: string | number
}

interface PorkbunSuccessResponse {
  status: 'success'
  records?: PorkbunDNSRecord[]
  [key: string]: unknown
}

interface PorkbunErrorResponse {
  status: string
  message?: string
  [key: string]: unknown
}

type PorkbunResponse = PorkbunSuccessResponse | PorkbunErrorResponse

function requireBaseEnv(): void {
  const missing: string[] = []

  if (!API_KEY) missing.push('PORKBUN_API_KEY')
  if (!API_SECRET) missing.push('PORKBUN_API_SECRET')
  if (!DOMAIN) missing.push('PORKBUN_DOMAIN')

  if (missing.length > 0) {
    throw new Error(`Missing required environment variable(s): ${missing.join(', ')}`)
  }

  if (!VALID_DOMAINS.has(DOMAIN)) {
    throw new Error(
      `Invalid PORKBUN_DOMAIN="${DOMAIN}". Expected one of: ${Array.from(VALID_DOMAINS).join(', ')}`,
    )
  }
}

function requireVercelDnsEnv(): void {
  const missing: string[] = []

  if (!VERCEL_APEX_A_RECORD) missing.push('VERCEL_APEX_A_RECORD')
  if (!VERCEL_WWW_CNAME_RECORD) missing.push('VERCEL_WWW_CNAME_RECORD')

  if (INCLUDE_API_SUBDOMAIN && !VERCEL_API_CNAME_RECORD) {
    missing.push('VERCEL_API_CNAME_RECORD')
  }

  if (missing.length > 0) {
    throw new Error(
      [
        `Missing Vercel DNS value(s): ${missing.join(', ')}`,
        'Copy the exact values from Vercel domain settings into .env.local.',
      ].join('\n'),
    )
  }
}

function assertPorkbunSuccess(result: PorkbunResponse): asserts result is PorkbunSuccessResponse {
  if (result.status !== 'success') {
    throw new Error(`Porkbun API Error: ${result.message || 'Unknown error'}`)
  }
}

function getDomain(): string {
  requireBaseEnv()
  return DOMAIN as string
}

function displayRecordName(name: string): string {
  const domain = getDomain()

  if (!name || name === '@' || name === domain) {
    return '@'
  }

  const suffix = `.${domain}`

  if (name.endsWith(suffix)) {
    const trimmed = name.slice(0, -suffix.length)
    return trimmed || '@'
  }

  return name
}

function normalizeRecordName(name: string): string {
  return displayRecordName(name)
}

function toPorkbunRecordName(name: string): string {
  // Porkbun uses an empty name for apex/root records during create.
  return name === '@' ? '' : name
}

function isManagedName(name: string): boolean {
  const normalized = normalizeRecordName(name)

  if (normalized === '@') return true
  if (normalized === 'www') return true
  if (INCLUDE_API_SUBDOMAIN && normalized === 'api') return true

  return false
}

function isConflictingManagedRecord(record: PorkbunDNSRecord): boolean {
  if (!isManagedName(record.name)) return false

  return ['A', 'AAAA', 'ALIAS', 'CNAME'].includes(record.type)
}

function isSameRecordTarget(record: PorkbunDNSRecord, desired: DesiredDNSRecord): boolean {
  return (
    normalizeRecordName(record.name) === desired.name &&
    record.type === desired.type &&
    record.content === desired.content
  )
}

function getDesiredVercelRecords(): DesiredDNSRecord[] {
  requireVercelDnsEnv()

  const records: DesiredDNSRecord[] = [
    {
      type: 'A',
      name: '@',
      content: VERCEL_APEX_A_RECORD as string,
      ttl: 3600,
    },
    {
      type: 'CNAME',
      name: 'www',
      content: VERCEL_WWW_CNAME_RECORD as string,
      ttl: 3600,
    },
  ]

  if (INCLUDE_API_SUBDOMAIN) {
    records.push({
      type: 'CNAME',
      name: 'api',
      content: VERCEL_API_CNAME_RECORD as string,
      ttl: 3600,
    })
  }

  return records
}

async function apiCall(
  endpoint: string,
  data: Record<string, string | number | undefined>,
): Promise<PorkbunSuccessResponse> {
  requireBaseEnv()

  const response = await fetch(`${PORKBUN_API_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apikey: API_KEY,
      secretapikey: API_SECRET,
      ...data,
    }),
  })

  const result = (await response.json()) as PorkbunResponse

  if (!response.ok) {
    throw new Error(`Porkbun HTTP Error ${response.status}: ${response.statusText}`)
  }

  assertPorkbunSuccess(result)

  return result
}

async function getDNSRecords(): Promise<PorkbunDNSRecord[]> {
  const domain = getDomain()

  console.log(`Fetching DNS records for ${domain}...`)

  const result = await apiCall(`/dns/retrieve/${domain}`, {})

  return result.records || []
}

async function createDNSRecord(record: DesiredDNSRecord): Promise<void> {
  const domain = getDomain()
  const name = toPorkbunRecordName(record.name)

  console.log(`Creating ${record.type} ${record.name} -> ${record.content}`)

  if (!APPLY_CHANGES) {
    console.log('DRY RUN: create skipped. Add --apply to make changes.')
    return
  }

  await apiCall(`/dns/create/${domain}`, {
    name,
    type: record.type,
    content: record.content,
    ttl: record.ttl ?? 3600,
    prio: record.priority,
  })

  console.log(`Created ${record.type} ${record.name} successfully`)
}

async function deleteDNSRecord(record: PorkbunDNSRecord): Promise<void> {
  const domain = getDomain()

  console.log(
    `Deleting [${record.id}] ${record.type} ${displayRecordName(record.name)} -> ${record.content}`,
  )

  if (!APPLY_CHANGES) {
    console.log('DRY RUN: delete skipped. Add --apply to make changes.')
    return
  }

  await apiCall(`/dns/delete/${domain}/${record.id}`, {})

  console.log(`Deleted record ${record.id} successfully`)
}

async function listDNSRecords(): Promise<void> {
  const domain = getDomain()

  console.log(`Current DNS records for ${domain}:`)
  console.log('')

  const records = await getDNSRecords()

  if (records.length === 0) {
    console.log('No DNS records found')
    return
  }

  records.forEach((record: PorkbunDNSRecord) => {
    const ttl = record.ttl ? ` ttl=${record.ttl}` : ''
    const prio = record.prio || record.priority
    const priority = prio ? ` priority=${prio}` : ''

    console.log(
      `  [${record.id}] ${record.type.padEnd(6)} ${displayRecordName(record.name).padEnd(20)} -> ${record.content}${ttl}${priority}`,
    )
  })

  console.log('')
  console.log(`Total: ${records.length} record(s)`)
}

async function setupVercelDNS(): Promise<void> {
  const domain = getDomain()
  const desiredRecords = getDesiredVercelRecords()

  console.log(`Setting up Vercel DNS for ${domain}`)
  console.log('')

  console.log('Desired records from .env.local:')
  desiredRecords.forEach((record: DesiredDNSRecord) => {
    console.log(
      `  ${record.type.padEnd(6)} ${record.name.padEnd(8)} -> ${record.content}`,
    )
  })

  console.log('')

  if (APPLY_CHANGES) {
    console.log('Mode: APPLY')
    console.log('Matching A/AAAA/ALIAS/CNAME records for managed names may be replaced.')
  } else {
    console.log('Mode: DRY RUN')
    console.log('No DNS records will be changed. Add --apply to make changes.')
  }

  console.log('')

  const existingRecords = await getDNSRecords()

  const conflictingRecords = existingRecords.filter((record: PorkbunDNSRecord) =>
    isConflictingManagedRecord(record),
  )

  const alreadyCorrectRecords = desiredRecords.filter((desired: DesiredDNSRecord) =>
    existingRecords.some((existing: PorkbunDNSRecord) =>
      isSameRecordTarget(existing, desired),
    ),
  )

  if (alreadyCorrectRecords.length > 0) {
    console.log('Already correct:')
    alreadyCorrectRecords.forEach((record: DesiredDNSRecord) => {
      console.log(
        `  ${record.type.padEnd(6)} ${record.name.padEnd(8)} -> ${record.content}`,
      )
    })
    console.log('')
  }

  if (conflictingRecords.length > 0) {
    console.log('Records that will be removed/replaced:')
    conflictingRecords.forEach((record: PorkbunDNSRecord) => {
      console.log(
        `  [${record.id}] ${record.type.padEnd(6)} ${displayRecordName(record.name).padEnd(8)} -> ${record.content}`,
      )
    })
    console.log('')
  } else {
    console.log('No conflicting managed records found.')
    console.log('')
  }

  for (const record of conflictingRecords) {
    await deleteDNSRecord(record)
  }

  for (const desired of desiredRecords) {
    const wasAlreadyCorrect = alreadyCorrectRecords.some(
      (record: DesiredDNSRecord) =>
        record.type === desired.type &&
        record.name === desired.name &&
        record.content === desired.content,
    )

    if (wasAlreadyCorrect && conflictingRecords.length === 0) {
      continue
    }

    await createDNSRecord(desired)
  }

  console.log('')

  if (APPLY_CHANGES) {
    console.log('DNS setup complete.')
  } else {
    console.log('Dry run complete. Re-run with --apply to actually change DNS.')
  }
}

async function setupClerkDNS(): Promise<void> {
  console.log('Clerk DNS setup is not automated here.')
  console.log('')
  console.log('Clerk verification records are project-specific.')
  console.log('Copy exact TXT/CNAME records from the Clerk dashboard before adding them.')
}

function printUsage(): void {
  console.log('Porkbun DNS Manager')
  console.log('')
  console.log(`Current domain: ${DOMAIN || '(missing PORKBUN_DOMAIN)'}`)
  console.log('')
  console.log('Usage:')
  console.log('  npx ts-node scripts/porkbun-dns.ts list')
  console.log('  npx ts-node scripts/porkbun-dns.ts setup-vercel')
  console.log('  npx ts-node scripts/porkbun-dns.ts setup-vercel --apply')
  console.log('  npx ts-node scripts/porkbun-dns.ts setup-clerk')
  console.log('')
  console.log('Required .env.local:')
  console.log('  PORKBUN_API_KEY=')
  console.log('  PORKBUN_API_SECRET=')
  console.log('  PORKBUN_DOMAIN=thegreenlist.online')
  console.log('  VERCEL_APEX_A_RECORD=')
  console.log('  VERCEL_WWW_CNAME_RECORD=')
  console.log('')
  console.log('Optional .env.local:')
  console.log('  INCLUDE_API_SUBDOMAIN=false')
  console.log('  VERCEL_API_CNAME_RECORD=')
  console.log('')
  console.log('Valid PORKBUN_DOMAIN values:')
  console.log('  thegreenlist.online')
  console.log('  greenlist.online')
}

async function main(): Promise<void> {
  const command = process.argv[2]

  try {
    switch (command) {
      case 'list':
        await listDNSRecords()
        break

      case 'setup-vercel':
        await setupVercelDNS()
        break

      case 'setup-clerk':
        await setupClerkDNS()
        break

      case 'setup-all':
        await setupVercelDNS()
        console.log('')
        console.log('---')
        console.log('')
        await setupClerkDNS()
        break

      default:
        printUsage()
        break
    }
  } catch (error) {
    console.error('')
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

void main()
