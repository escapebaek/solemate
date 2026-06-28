import { NextRequest } from 'next/server'
import { searchRunningShoes } from '@/lib/running-shoes-db'
import { SneakerSearchResult } from '@/lib/types'
import { createClient } from '@/lib/supabase/server'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const HAS_RAPIDAPI = RAPIDAPI_KEY && RAPIDAPI_KEY !== 'your_rapidapi_key'

async function fetchFromRapidApi(q: string): Promise<Record<string, unknown>[]> {
  const res = await fetch(
    `https://the-sneaker-database.p.rapidapi.com/sneakers?name=${encodeURIComponent(q)}&limit=10`,
    {
      headers: {
        'x-rapidapi-key': RAPIDAPI_KEY!,
        'x-rapidapi-host': 'the-sneaker-database.p.rapidapi.com',
      },
      next: { revalidate: 3600 },
    }
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.results || []) as Record<string, unknown>[]
}

function getThumb(apiItem: Record<string, unknown>): string | undefined {
  return ((apiItem.image as Record<string, unknown>)?.thumbnail as string) || undefined
}

async function searchCommunityShoes(q: string): Promise<SneakerSearchResult[]> {
  try {
    const supabase = await createClient()
    const terms = q.trim().split(/\s+/)

    // Build OR filter across brand, model, name
    const filter = terms
      .map(t => `brand.ilike.%${t}%,model.ilike.%${t}%,name.ilike.%${t}%`)
      .join(',')

    const { data } = await supabase
      .from('community_shoes')
      .select('id, brand, model, name, colorway, gender, retail_price, description, weight, drop, stack_height, cushioning, image_url')
      .or(filter)
      .order('usage_count', { ascending: false })
      .limit(10)

    if (!data) return []

    return data.map(row => ({
      id: `c-${row.id}`,
      brand: row.brand,
      model: row.model,
      name: row.name || `${row.brand} ${row.model}`,
      colorway: row.colorway ?? undefined,
      gender: row.gender ?? undefined,
      retailPrice: row.retail_price ?? undefined,
      description: row.description ?? undefined,
      thumbnail: row.image_url ?? undefined,
      weight: row.weight ?? undefined,
      drop: row.drop ?? undefined,
      stack_height: row.stack_height ?? undefined,
      cushioning: row.cushioning ?? undefined,
      isCommunity: true,
    } as SneakerSearchResult & { isCommunity: boolean }))
  } catch {
    return []
  }
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')
  if (!q) return Response.json({ results: [] })

  const [localResults, communityResults] = await Promise.all([
    Promise.resolve(searchRunningShoes(q)),
    searchCommunityShoes(q),
  ])

  // De-duplicate community results that overlap with local DB (same brand+model)
  const localKeys = new Set(localResults.map(r => `${r.brand.toLowerCase()}|${r.model.toLowerCase()}`))
  const filteredCommunity = communityResults.filter(
    r => !localKeys.has(`${r.brand.toLowerCase()}|${r.model.toLowerCase()}`)
  )

  if (!HAS_RAPIDAPI) {
    return Response.json({ results: [...localResults, ...filteredCommunity] })
  }

  try {
    const apiItems = await fetchFromRapidApi(q)

    const enrichedLocal: SneakerSearchResult[] = localResults.map(local => {
      const match = apiItems.find(s => {
        const apiName = String(s.name ?? '').toLowerCase()
        const apiSilhouette = String(s.silhouette ?? '').toLowerCase()
        const localModel = local.model.toLowerCase()
        return apiName.includes(localModel) || apiSilhouette.includes(localModel) || localModel.includes(apiSilhouette)
      })
      return match ? { ...local, thumbnail: getThumb(match) } : local
    })

    if (enrichedLocal.length > 0 || filteredCommunity.length > 0) {
      return Response.json({ results: [...enrichedLocal, ...filteredCommunity] })
    }

    // No local or community results → raw RapidAPI results
    const results: SneakerSearchResult[] = apiItems.map(s => ({
      id: String(s.id),
      brand: String(s.brand ?? ''),
      model: String(s.silhouette ?? ''),
      name: String(s.name ?? ''),
      colorway: s.colorway ? String(s.colorway) : undefined,
      gender: s.gender ? String(s.gender) : undefined,
      releaseDate: s.releaseDate ? String(s.releaseDate) : undefined,
      retailPrice: s.retailPrice ? Number(s.retailPrice) : undefined,
      thumbnail: getThumb(s),
      description: s.description ? String(s.description) : undefined,
    }))
    return Response.json({ results })
  } catch {
    return Response.json({ results: [...localResults, ...filteredCommunity] })
  }
}
