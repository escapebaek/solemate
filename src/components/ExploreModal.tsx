'use client'

import { useEffect, useState, useMemo } from 'react'
import { X, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Shoe } from '@/lib/types'
import { pickBestColorwayImage } from '@/lib/colorway'
import Link from 'next/link'

const CATEGORY_GROUPS = [
  {
    label: 'Type',
    items: [
      { value: 'stability', label: 'Stability' },
      { value: 'cushioned', label: 'Cushioned' },
      { value: 'responsive', label: 'Responsive' },
      { value: 'motion_control', label: 'Motion Control' },
      { value: 'minimalist', label: 'Minimalist' },
      { value: 'plated', label: 'Plated' },
    ],
  },
  {
    label: 'Purpose',
    items: [
      { value: 'racing', label: 'Racing' },
      { value: 'daily_training', label: 'Daily Training' },
      { value: 'long_run', label: 'Long Run' },
      { value: 'recovery', label: 'Recovery Run' },
      { value: 'trail', label: 'Trail' },
      { value: 'tempo', label: 'Tempo / Workout' },
    ],
  },
]

const ATTR_GROUPS = [
  {
    key: 'toe_box',
    label: 'Toe Box',
    options: [
      { value: 'wide', label: 'Wide' },
      { value: 'normal', label: 'Normal' },
      { value: 'narrow', label: 'Narrow' },
    ],
  },
  {
    key: 'midsole_feel',
    label: 'Midsole',
    options: [
      { value: 'soft', label: 'Soft' },
      { value: 'medium', label: 'Medium' },
      { value: 'firm', label: 'Firm' },
    ],
  },
  {
    key: 'outsole_grip',
    label: 'Grip',
    options: [
      { value: 'grippy', label: 'Grippy' },
      { value: 'average', label: 'Average' },
      { value: 'slippery', label: 'Slippery' },
    ],
  },
]

type ShoeAgg = {
  catCounts: Record<string, number>
  catVoters: number
  attrCounts: Record<string, Record<string, number>>
  attrTotals: Record<string, number>
  ratingSum: number
  ratingCount: number
}

type RawCommunityShoe = {
  id: string
  brand: string
  model: string
  image_url: string | null
}

type ShoeEntry = {
  shoeRef: string
  brand: string
  model: string
  imageUrl: string | null
}

type ActiveFilter =
  | { type: 'category'; value: string; label: string }
  | { type: 'attr'; key: string; value: string; label: string }
  | null

interface Props {
  userShoes: Shoe[]
  onClose: () => void
}

export default function ExploreModal({ userShoes, onClose }: Props) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [searchText, setSearchText] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>(null)

  // Raw community_shoes from DB (unfiltered)
  const [rawCommunityShoes, setRawCommunityShoes] = useState<RawCommunityShoe[]>([])
  // Image fallbacks for community shoes without image_url
  const [imgFallbacks, setImgFallbacks] = useState<Record<string, string>>({})
  // Aggregated ratings for all shoe refs
  const [aggMap, setAggMap] = useState<Map<string, ShoeAgg>>(new Map())

  // shoeRef → user's shoe.id (for navigation to detail page)
  const ownedMap = useMemo(
    () =>
      new Map(
        userShoes
          .filter(s => s.sneaker_db_id)
          .map(s => [s.sneaker_db_id!, s.id])
      ),
    [userShoes]
  )

  useEffect(() => {
    async function load() {
      // 1. Fetch all community shoes from DB
      const { data: cData } = await supabase
        .from('community_shoes')
        .select('id, brand, model, image_url')
      const cShoes = (cData || []) as RawCommunityShoe[]
      setRawCommunityShoes(cShoes)

      // 2. Collect all shoe refs to query ratings for:
      //    - community shoe refs (c-xxx)
      //    - non-community user shoe refs (n-xxx, brand|model, etc.)
      const communityRefs = cShoes.map(s => `c-${s.id}`)
      const nonCommunityRefs = [
        ...new Set(
          userShoes
            .filter(s => s.sneaker_db_id && !s.sneaker_db_id.startsWith('c-'))
            .map(s => s.sneaker_db_id!)
        ),
      ]
      const allRefs = [...communityRefs, ...nonCommunityRefs]

      // 3. Fetch ratings for all refs
      if (allRefs.length > 0) {
        const { data: ratings } = await supabase
          .from('shoe_ratings')
          .select(
            'shoe_ref, categories, toe_box, midsole_feel, outsole_grip, breathability, durability, rating'
          )
          .in('shoe_ref', allRefs)

        // 4. Build aggMap
        const map = new Map<string, ShoeAgg>()
        for (const r of (ratings || []) as Record<string, unknown>[]) {
          const ref = r.shoe_ref as string
          if (!map.has(ref)) {
            map.set(ref, {
              catCounts: {},
              catVoters: 0,
              attrCounts: {},
              attrTotals: {},
              ratingSum: 0,
              ratingCount: 0,
            })
          }
          const agg = map.get(ref)!

          const cats = r.categories as string[] | null
          if (cats && cats.length > 0) {
            agg.catVoters++
            for (const c of cats) agg.catCounts[c] = (agg.catCounts[c] ?? 0) + 1
          }

          for (const k of ['toe_box', 'midsole_feel', 'outsole_grip', 'breathability', 'durability']) {
            const v = r[k] as string | null
            if (v) {
              if (!agg.attrCounts[k]) agg.attrCounts[k] = {}
              agg.attrCounts[k][v] = (agg.attrCounts[k][v] ?? 0) + 1
              agg.attrTotals[k] = (agg.attrTotals[k] ?? 0) + 1
            }
          }

          const rat = r.rating as number | null
          if (rat != null) {
            agg.ratingSum += rat
            agg.ratingCount++
          }
        }
        setAggMap(map)
      }

      // 5. Load image fallbacks for community shoes without image_url
      const noImg = cShoes.filter(s => !s.image_url)
      if (noImg.length > 0) {
        const pairs = [
          ...new Map(
            noImg.map(s => [
              `${s.brand.toLowerCase()}|${s.model.toLowerCase()}`,
              { brand: s.brand, model: s.model },
            ])
          ).values(),
        ]
        const fallbacks: Record<string, string> = {}
        await Promise.all(
          pairs.map(async ({ brand, model }) => {
            const { data: cws } = await supabase
              .from('shoe_colorways')
              .select('image_url, created_by')
              .ilike('brand', brand)
              .ilike('model', model)
              .not('image_url', 'is', null)
              .order('created_at', { ascending: true })
            const img = pickBestColorwayImage(cws || [])
            if (img) fallbacks[`${brand.toLowerCase()}|${model.toLowerCase()}`] = img
          })
        )
        setImgFallbacks(fallbacks)
      }

      setLoading(false)
    }

    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Build the unified shoe list reactively from loaded data + userShoes prop
  const shoeList = useMemo<ShoeEntry[]>(() => {
    // Community shoes: only show if the current user owns it OR it has at least one rating
    const communityEntries = rawCommunityShoes
      .filter(s => {
        const ref = `c-${s.id}`
        return ownedMap.has(ref) || aggMap.has(ref)
      })
      .map(s => {
        const imgKey = `${s.brand.toLowerCase()}|${s.model.toLowerCase()}`
        return {
          shoeRef: `c-${s.id}`,
          brand: s.brand,
          model: s.model,
          imageUrl: s.image_url || imgFallbacks[imgKey] || null,
        }
      })

    // Non-community user shoes (n-xxx etc.) not already in community list
    const communityRefSet = new Set(communityEntries.map(e => e.shoeRef))
    const seenNonCommunity = new Set<string>()
    const nonCommunityEntries: ShoeEntry[] = []

    for (const s of userShoes) {
      if (!s.sneaker_db_id || s.sneaker_db_id.startsWith('c-')) continue
      if (communityRefSet.has(s.sneaker_db_id)) continue
      if (seenNonCommunity.has(s.sneaker_db_id)) continue
      seenNonCommunity.add(s.sneaker_db_id)
      nonCommunityEntries.push({
        shoeRef: s.sneaker_db_id,
        brand: s.brand,
        model: s.model,
        imageUrl: s.image_url || null,
      })
    }

    return [...communityEntries, ...nonCommunityEntries]
  }, [rawCommunityShoes, imgFallbacks, aggMap, ownedMap, userShoes])

  const results = useMemo(() => {
    const q = searchText.trim().toLowerCase()

    let list = shoeList.filter(
      s =>
        !q ||
        s.brand.toLowerCase().includes(q) ||
        s.model.toLowerCase().includes(q) ||
        `${s.brand} ${s.model}`.toLowerCase().includes(q)
    )

    if (activeFilter?.type === 'category') {
      const cat = activeFilter.value
      list = list.filter(s => (aggMap.get(s.shoeRef)?.catCounts[cat] ?? 0) > 0)
      list.sort((a, b) => {
        const aggA = aggMap.get(a.shoeRef)
        const aggB = aggMap.get(b.shoeRef)
        const pA = aggA && aggA.catVoters > 0 ? aggA.catCounts[cat] / aggA.catVoters : 0
        const pB = aggB && aggB.catVoters > 0 ? aggB.catCounts[cat] / aggB.catVoters : 0
        return pB - pA
      })
    } else if (activeFilter?.type === 'attr') {
      const { key, value } = activeFilter
      list = list.filter(s => (aggMap.get(s.shoeRef)?.attrCounts[key]?.[value] ?? 0) > 0)
      list.sort((a, b) => {
        const aggA = aggMap.get(a.shoeRef)
        const aggB = aggMap.get(b.shoeRef)
        const pA =
          aggA && aggA.attrTotals[key] > 0
            ? (aggA.attrCounts[key]?.[value] ?? 0) / aggA.attrTotals[key]
            : 0
        const pB =
          aggB && aggB.attrTotals[key] > 0
            ? (aggB.attrCounts[key]?.[value] ?? 0) / aggB.attrTotals[key]
            : 0
        return pB - pA
      })
    } else {
      // Default: most reviewed first
      list.sort(
        (a, b) =>
          (aggMap.get(b.shoeRef)?.ratingCount ?? 0) - (aggMap.get(a.shoeRef)?.ratingCount ?? 0)
      )
    }

    return list.map(s => {
      const agg = aggMap.get(s.shoeRef)

      let metric: { pct: number; label: string; voters: number } | null = null
      if (activeFilter?.type === 'category' && agg && agg.catVoters > 0) {
        const count = agg.catCounts[activeFilter.value] ?? 0
        metric = {
          pct: Math.round((count / agg.catVoters) * 100),
          label: activeFilter.label,
          voters: agg.catVoters,
        }
      } else if (
        activeFilter?.type === 'attr' &&
        agg &&
        agg.attrTotals[activeFilter.key] > 0
      ) {
        const count = agg.attrCounts[activeFilter.key]?.[activeFilter.value] ?? 0
        const attrLabel =
          activeFilter.key === 'toe_box'
            ? 'Toe Box'
            : activeFilter.key === 'midsole_feel'
              ? 'Midsole'
              : 'Grip'
        metric = {
          pct: Math.round((count / agg.attrTotals[activeFilter.key]) * 100),
          label: `${activeFilter.label} ${attrLabel}`,
          voters: agg.attrTotals[activeFilter.key],
        }
      }

      return {
        ...s,
        agg,
        metric,
        ownedShoeId: ownedMap.get(s.shoeRef),
      }
    })
  }, [shoeList, aggMap, searchText, activeFilter, ownedMap])

  function toggleFilter(f: NonNullable<ActiveFilter>) {
    setActiveFilter(prev => {
      if (!prev) return f
      if (f.type === 'category' && prev.type === 'category' && prev.value === f.value) return null
      if (
        f.type === 'attr' &&
        prev.type === 'attr' &&
        prev.key === f.key &&
        prev.value === f.value
      )
        return null
      return f
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      {/* Header */}
      <div className="safe-area-top border-b border-[var(--border)] bg-white">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-[var(--stone)] hover:text-[var(--ink)] transition-colors p-1 -ml-1"
          >
            <X size={18} />
          </button>
          <p className="text-[0.6rem] tracking-[0.2em] text-[var(--stone)] uppercase font-medium flex-1">
            Explore
          </p>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden flex-1">
        {/* Search */}
        <div className="border-b border-[var(--border)] bg-white px-4 py-2.5 max-w-2xl w-full mx-auto self-stretch">
          <div className="flex items-center gap-2.5 border border-[var(--border)] px-3 py-2 focus-within:border-[var(--border-strong)] transition-colors">
            <Search size={13} className="text-[var(--stone-light)] shrink-0" />
            <input
              type="text"
              placeholder="Search by brand or model..."
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              autoFocus
              className="flex-1 text-sm text-[var(--ink)] placeholder:text-[var(--stone-light)] bg-transparent outline-none min-w-0"
            />
            {searchText && (
              <button
                onClick={() => setSearchText('')}
                className="text-[var(--stone-light)] hover:text-[var(--stone)] shrink-0"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="border-b border-[var(--border)] bg-white">
          <div className="max-w-2xl mx-auto px-4 py-3 space-y-2.5">
            {CATEGORY_GROUPS.map(group => (
              <div key={group.label} className="flex items-start gap-2">
                <span className="text-[0.55rem] tracking-[0.1em] text-[var(--stone-light)] uppercase shrink-0 w-14 pt-1">
                  {group.label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map(item => {
                    const isActive =
                      activeFilter?.type === 'category' && activeFilter.value === item.value
                    return (
                      <button
                        key={item.value}
                        onClick={() =>
                          toggleFilter({ type: 'category', value: item.value, label: item.label })
                        }
                        className={`px-2.5 py-1 text-[0.62rem] tracking-wide border rounded-sm transition-all ${
                          isActive
                            ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                            : 'text-[var(--stone)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}

            {ATTR_GROUPS.map(group => (
              <div key={group.key} className="flex items-start gap-2">
                <span className="text-[0.55rem] tracking-[0.1em] text-[var(--stone-light)] uppercase shrink-0 w-14 pt-1">
                  {group.label}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {group.options.map(opt => {
                    const isActive =
                      activeFilter?.type === 'attr' &&
                      activeFilter.key === group.key &&
                      activeFilter.value === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() =>
                          toggleFilter({
                            type: 'attr',
                            key: group.key,
                            value: opt.value,
                            label: opt.label,
                          })
                        }
                        className={`px-2.5 py-1 text-[0.62rem] tracking-wide border rounded-sm transition-all ${
                          isActive
                            ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                            : 'text-[var(--stone)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-5 h-5 border border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="max-w-2xl mx-auto px-4 py-4">
              {results.length === 0 ? (
                <p className="text-center text-xs text-[var(--stone)] py-16">
                  {searchText || activeFilter ? 'No matching shoes' : 'No shoes found'}
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-[0.58rem] tracking-[0.12em] text-[var(--stone-light)] uppercase mb-3">
                    {results.length} {results.length === 1 ? 'shoe' : 'shoes'}
                    {activeFilter && (
                      <>
                        {' · '}
                        <button
                          onClick={() => setActiveFilter(null)}
                          className="underline hover:text-[var(--stone)] transition-colors"
                        >
                          Clear filter
                        </button>
                      </>
                    )}
                  </p>

                  {results.map(({ shoeRef, brand, model, imageUrl, agg, metric, ownedShoeId }) => {
                    const avgRating =
                      agg && agg.ratingCount > 0
                        ? (agg.ratingSum / agg.ratingCount).toFixed(1)
                        : null

                    const cardContent = (
                      <div className="flex items-center gap-3 p-3 border border-[var(--border)] group-hover:border-[var(--border-strong)] transition-colors">
                        {/* Thumbnail */}
                        <div className="w-16 h-12 bg-[var(--bg-subtle)] shrink-0 flex items-center justify-center overflow-hidden">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={`${brand} ${model}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <span className="text-[0.45rem] text-[var(--stone-light)] uppercase tracking-wider">
                              no img
                            </span>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[0.55rem] tracking-[0.12em] text-[var(--stone)] uppercase">
                            {brand}
                          </p>
                          <p className="text-[0.82rem] font-semibold text-[var(--ink)] truncate leading-tight">
                            {model}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                            {avgRating && (
                              <span className="text-[0.58rem] text-[var(--stone-light)]">
                                ★ {avgRating} ({agg!.ratingCount})
                              </span>
                            )}
                            {ownedShoeId && (
                              <span className="text-[0.52rem] tracking-[0.08em] text-[var(--stone)] border border-[var(--border)] px-1.5 py-0.5 uppercase">
                                Owned
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Metric badge */}
                        {metric && (
                          <div className="shrink-0 text-right min-w-[3.5rem]">
                            <p className="text-xl font-black text-[var(--ink)] leading-none">
                              {metric.pct}%
                            </p>
                            <p className="text-[0.52rem] text-[var(--stone)] mt-0.5 leading-tight">
                              {metric.label}
                            </p>
                            <p className="text-[0.52rem] text-[var(--stone-light)]">
                              {metric.voters} votes
                            </p>
                          </div>
                        )}
                      </div>
                    )

                    return ownedShoeId ? (
                      <Link
                        key={shoeRef}
                        href={`/shoes/${ownedShoeId}`}
                        onClick={onClose}
                        className="block group"
                      >
                        {cardContent}
                      </Link>
                    ) : (
                      <div key={shoeRef} className="group cursor-default">
                        {cardContent}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
