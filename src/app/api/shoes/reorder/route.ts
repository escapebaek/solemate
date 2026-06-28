import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Receives { ids: string[] } — updates sort_order in bulk
export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { ids } = await req.json() as { ids: string[] }

  if (!Array.isArray(ids) || ids.length === 0) {
    return Response.json({ error: 'Missing ids' }, { status: 400 })
  }

  const updates = ids.map((id, index) =>
    supabase.from('shoes').update({ sort_order: index }).eq('id', id)
  )

  await Promise.all(updates)
  return Response.json({ ok: true })
}
