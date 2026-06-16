/**
 * Porkbun DNS Configuration Script
 * Manages DNS records for thegreenlist.online via Porkbun API.
 * Set PORKBUN_DOMAIN=thegreenlist.online for the primary domain or greenlist.online for the secondary domain.
 */

import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const PORKBUN_API_URL = 'https://porkbun.com/api/json/v3'
const API_KEY = process.env.PORKBUN_API_KEY
const API_SECRET = process.env.PORKBUN_API_SECRET
const DOMAIN = process.env.PORKBUN_DOMAIN

interface DNSRecord {
  type: string
  name: string
  content: string
  ttl?: number
  priority?: number
}

const authPayload = {
  apikey: API_KEY,
  secretapikey: API_SECRET,
}

async function apiCall(endpoint: string, data: any) {
  const response = await fetch(`${PORKBUN_API_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...authPayload, ...data }),
  })

  const result = await response.json()

  if (result.status !== 'success') {
    throw new Error(`Porkbun API Error: ${result.message}`)
  }

  return result
}

async function getDNSRecords() {
  console.log(`Fetching DNS records for ${DOMAIN}...`)
  const result = await apiCall('/dns/retrieve', { domain: DOMAIN })
  return result.records || []
}

async function createDNSRecord(record: DNSRecord) {
  console.log(`Creating ${record.type} record: ${record.name} -> ${record.content}`)

  await apiCall('/dns/create', {
    domain: DOMAIN,
    name: record.name,
    type: record.type,
    content: record.content,
    ttl: record.ttl || 3600,
    ...(record.priority && { prio: record.priority }),
  })

  console.log(`Created ${record.type} record successfully`)
}

async function deleteDNSRecord(id: string) {
  console.log(`Deleting DNS record ID: ${id}`)

  await apiCall('/dns/delete', {
    domain: DOMAIN,
    id,
  })

  console.log('Deleted record successfully')
}

async function setupVercelDNS() {
  console.log('Setting up DNS for Vercel deployment...\n')

  // Vercel nameservers (use these at registrar)
  console.log('Point nameservers at your registrar to:')
  console.log('   ns1.vercel-dns.com')
  console.log('   ns2.vercel-dns.com')
  console.log('')

  // Get existing records
  const records = await getDNSRecords()
  console.log(`Found ${records.length} existing DNS records\n`)

  // Define desired records for Vercel
  const desiredRecords: DNSRecord[] = [
    {
      type: 'A',
      name: '@',
      content: '76.76.19.165', // Vercel IP
      ttl: 3600,
    },
    {
      type: 'A',
      name: 'www',
      content: '76.76.19.165',
      ttl: 3600,
    },
    {
      type: 'CNAME',
      name: 'api',
      content: 'cname.vercel-dns.com',
      ttl: 3600,
    },
  ]

  console.log('Desired records:')
  desiredRecords.forEach((r) => {
    console.log(`   ${r.type}: ${r.name || '@'} -> ${r.content}`)
  })
  console.log('')

  // Clean up old records and create new ones
  for (const record of records) {
    if (
      (record.type === 'A' && (record.name === '@' || record.name === 'www')) ||
      (record.type === 'CNAME' && record.name === 'api')
    ) {
      await deleteDNSRecord(record.id)
    }
  }

  // Create new records
  for (const record of desiredRecords) {
    await createDNSRecord(record)
  }

  console.log('\nDNS configuration complete!')
}

async function setupClerkDNS() {
  console.log('Setting up DNS records for Clerk...\n')

  // You may need specific TXT records for Clerk verification
  // Check your Clerk dashboard for verification records

  console.log('Check Clerk dashboard for any required TXT records')
}

async function listDNSRecords() {
  console.log(`Current DNS records for ${DOMAIN}:\n`)

  const records = await getDNSRecords()

  if (records.length === 0) {
    console.log('No DNS records found')
    return
  }

  records.forEach((r) => {
    console.log(`  [${r.id}] ${r.type.padEnd(6)} ${(r.name || '@').padEnd(20)} -> ${r.content}`)
  })

  console.log(`\nTotal: ${records.length} records`)
}

// CLI Interface
const command = process.argv[2]

async function main() {
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
        console.log('\n---\n')
        await setupClerkDNS()
        break
      default:
        console.log('Porkbun DNS Manager')
        console.log('')
        console.log('Usage:')
        console.log('  npx ts-node scripts/porkbun-dns.ts list          - List current DNS records')
        console.log('  npx ts-node scripts/porkbun-dns.ts setup-vercel  - Setup Vercel DNS')
        console.log('  npx ts-node scripts/porkbun-dns.ts setup-clerk   - Setup Clerk DNS')
        console.log('  npx ts-node scripts/porkbun-dns.ts setup-all     - Setup all DNS')
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

main()
