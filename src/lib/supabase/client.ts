import { createBrowserClient } from '@supabase/ssr'
import { createMockClient } from './mock-client'

const IS_DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
const VALID_URL = SUPABASE_URL.startsWith('http') ? SUPABASE_URL : 'https://placeholder.supabase.co'

export function createClient() {
  if (IS_DEV_MODE) return createMockClient() as ReturnType<typeof createBrowserClient>
  return createBrowserClient(VALID_URL, SUPABASE_KEY || 'placeholder-key')
}
