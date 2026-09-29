import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'

type EducationDetailRow = {
  id: string
  category: string
  title: string
  summary: string
  content: string
  source_urls: string[] | null
  status: string
  created_at: string
  updated_at: string
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createSupabaseServerClient()

    const { data: resource, error } = await supabase
      .from('education_resources')
      .select('id, category, title, summary, content, source_urls, status, created_at, updated_at')
      .eq('id', id)
      .maybeSingle<EducationDetailRow>()

    if (error) throw error

    // 404 for non-approved content so pending/draft/rejected resources are never leaked.
    if (!resource || resource.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    return NextResponse.json({ resource })
  } catch (error) {
    console.error('Error fetching education resource:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
