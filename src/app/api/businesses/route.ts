import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80) || 'business'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get('state')
    const city = searchParams.get('city')
    const businessType = searchParams.get('business_type')
    const search = searchParams.get('q')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(50, parseInt(searchParams.get('limit') || '20', 10) || 20)
    const from = (page - 1) * limit

    const supabase = await createSupabaseServerClient()
    let query = supabase
      .from('business_profiles')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1)

    if (state) query = query.eq('state', state)
    if (city) query = query.eq('city', city)
    if (businessType) query = query.eq('business_type', businessType)
    if (search) query = query.ilike('name', `%${search}%`)

    const { data: businesses, count, error } = await query
    if (error) throw error

    return NextResponse.json({
      businesses: businesses ?? [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        pages: Math.ceil((count ?? 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching businesses:', error)
    return NextResponse.json({ error: 'Failed to fetch businesses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, business_type, description, website_url, external_affiliate_url, state, city } = body

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }

    const baseSlug = slugify(name)
    let slug = baseSlug
    let attempt = 0

    while (attempt < 5) {
      const { data: existing } = await supabase
        .from('business_profiles')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (!existing) break
      attempt += 1
      slug = `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`
    }

    const { data: business, error } = await supabase
      .from('business_profiles')
      .insert({
        owner_id: user.id,
        name: name.trim(),
        slug,
        business_type: business_type || null,
        description: description || null,
        website_url: website_url || null,
        external_affiliate_url: external_affiliate_url || null,
        state: state || null,
        city: city || null,
        is_claimed: true,
        verification_status: 'unverified',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(business, { status: 201 })
  } catch (error) {
    console.error('Error creating business:', error)
    return NextResponse.json({ error: 'Failed to create business profile' }, { status: 500 })
  }
}
