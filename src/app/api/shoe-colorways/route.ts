import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const brand = req.nextUrl.searchParams.get('brand') ?? ''
  const model = req.nextUrl.searchParams.get('model') ?? ''

  if (!brand || !model) {
    return NextResponse.json({ colorways: [] })
  }

  const supabase = await createClient()
  const { data } = await supabase
    .from('shoe_colorways')
    .select('id, color, image_url, created_at')
    .ilike('brand', brand)
    .ilike('model', model)
    .order('created_at', { ascending: true })

  return NextResponse.json({ colorways: data ?? [] })
}
