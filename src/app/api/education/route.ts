import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

const CATEGORIES = new Set(['SAFETY_GUIDE', 'REGULATORY_RESOURCE', 'WORKER_RIGHTS', 'RESEARCH_SUMMARY'])

type EducationListRow = {
  id: string
  category: string
  title: string
  summary: string
  created_at: string
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (category && !CATEGORIES.has(category)) {
      return NextResponse.json({ error: 'Invalid category filter.' }, { status: 400 })
    }

    const supabase = await createSupabaseServerClient()
    let query = supabase
      .from('education_resources')
      .select('id, category, title, summary, created_at')
      .eq('status', 'APPROVED')
      .order('created_at', { ascending: false })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: resources, error } = await query.returns<EducationListRow[]>()

    if (error) throw error

    return NextResponse.json({ resources: resources ?? [] })
  } catch (error) {
    console.error('Error fetching education resources:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
