import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Server-side shoe update — avoids browser CORS PATCH restriction
export async function PATCH(req: NextRequest) {
  const supabase = await createClient()
  const { id, ...payload } = await req.json()

  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase
    .from('shoes')
    .update(payload)
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 400 })
  return Response.json({ ok: true })
}
