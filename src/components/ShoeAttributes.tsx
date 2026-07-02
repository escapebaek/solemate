'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type AttrKey = 'toe_box' | 'midsole_feel' | 'outsole_grip' | 'breathability' | 'durability'

const ATTRS: { key: AttrKey; label: string; options: { value: string; label: string }[] }[] = [
  {
    key: 'toe_box',
    label: 'Toe Box',
    options: [
      { value: 'narrow', label: 'Narrow' },
      { value: 'normal', label: 'Normal' },
      { value: 'wide', label: 'Wide' },
    ],
  },
  {
    key: 'midsole_feel',
    label: 'Midsole',
    options: [
      { value: 'firm', label: 'Firm' },
      { value: 'medium', label: 'Medium' },
      { value: 'soft', label: 'Soft' },
    ],
  },
  {
    key: 'outsole_grip',
    label: 'Outsole Grip',
    options: [
      { value: 'slippery', label: 'Slippery' },
      { value: 'average', label: 'Average' },
      { value: 'grippy', label: 'Grippy' },
    ],
  },
  {
    key: 'breathability',
    label: 'Breathability',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
  },
  {
    key: 'durability',
    label: 'Durability',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
    ],
  },
]

const CATEGORY_GROUPS = [
  {
    label: 'Type',
    items: [
      { value: 'stability',     label: 'Stability' },
      { value: 'cushioned',     label: 'Cushioned' },
      { value: 'responsive',    label: 'Responsive' },
      { value: 'motion_control',label: 'Motion Control' },
      { value: 'minimalist',    label: 'Minimalist' },
      { value: 'plated',        label: 'Plated' },
    ],
  },
  {
    label: 'Purpose',
    items: [
      { value: 'racing',         label: 'Racing' },
      { value: 'daily_training', label: 'Daily Training' },
      { value: 'long_run',       label: 'Long Run' },
      { value: 'recovery',       label: 'Recovery Run' },
      { value: 'trail',          label: 'Trail' },
      { value: 'tempo',          label: 'Tempo / Workout' },
    ],
  },
]

type AttrValues = Record<AttrKey, string | null>
type CommunityMap = Record<AttrKey, Record<string, number>>

function buildEmpty(): CommunityMap {
  const m = {} as CommunityMap
  for (const a of ATTRS) m[a.key] = Object.fromEntries(a.options.map(o => [o.value, 0]))
  return m
}

interface Props {
  shoeRef: string
  userId: string | null
  userEmail: string | null
}

export default function ShoeAttributes({ shoeRef, userId, userEmail }: Props) {
  const supabase = createClient()

  const [mine, setMine] = useState<AttrValues>({
    toe_box: null, midsole_feel: null, outsole_grip: null,
    breathability: null, durability: null,
  })
  const [community, setCommunity] = useState<CommunityMap>(buildEmpty)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<AttrKey | null>(null)

  // Categories
  const [myCategories, setMyCategories] = useState<string[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [catVoters, setCatVoters] = useState(0)
  const [catBusy, setCatBusy] = useState(false)

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('shoe_ratings')
        .select('user_id, toe_box, midsole_feel, outsole_grip, breathability, durability, categories')
        .eq('shoe_ref', shoeRef)

      if (!data) { setLoading(false); return }

      // Attr counts
      const counts = buildEmpty()
      for (const row of data as Record<string, unknown>[]) {
        for (const a of ATTRS) {
          const v = row[a.key] as string | null
          if (v && v in counts[a.key]) counts[a.key][v]++
        }
      }
      setCommunity(counts)

      // Category counts
      const catCounts: Record<string, number> = {}
      let voters = 0
      for (const row of data as Record<string, unknown>[]) {
        const cats = row.categories as string[] | null
        if (cats && cats.length > 0) {
          voters++
          for (const c of cats) catCounts[c] = (catCounts[c] ?? 0) + 1
        }
      }
      setCategoryCounts(catCounts)
      setCatVoters(voters)

      if (userId) {
        const myRow = (data as Record<string, unknown>[]).find(r => r.user_id === userId)
        if (myRow) {
          setMine({
            toe_box: (myRow.toe_box as string) ?? null,
            midsole_feel: (myRow.midsole_feel as string) ?? null,
            outsole_grip: (myRow.outsole_grip as string) ?? null,
            breathability: (myRow.breathability as string) ?? null,
            durability: (myRow.durability as string) ?? null,
          })
          setMyCategories((myRow.categories as string[]) ?? [])
        }
      }
      setLoading(false)
    }
    loadData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shoeRef, userId])

  async function pick(key: AttrKey, value: string) {
    if (!userId || busy) return
    setBusy(key)
    const next = mine[key] === value ? null : value
    const displayName = userEmail?.split('@')[0] ?? 'Runner'

    await supabase.from('shoe_ratings').upsert(
      { shoe_ref: shoeRef, user_id: userId, display_name: displayName, [key]: next },
      { onConflict: 'shoe_ref,user_id' }
    )

    setCommunity(prev => {
      const c = { ...prev, [key]: { ...prev[key] } }
      const old = mine[key]
      if (old) c[key][old] = Math.max(0, c[key][old] - 1)
      if (next) c[key][next] = (c[key][next] ?? 0) + 1
      return c
    })
    setMine(prev => ({ ...prev, [key]: next }))
    setBusy(null)
  }

  async function toggleCategory(cat: string) {
    if (!userId || catBusy) return
    setCatBusy(true)

    const isSelected = myCategories.includes(cat)
    const next = isSelected
      ? myCategories.filter(c => c !== cat)
      : [...myCategories, cat]

    const displayName = userEmail?.split('@')[0] ?? 'Runner'
    await supabase.from('shoe_ratings').upsert(
      { shoe_ref: shoeRef, user_id: userId, display_name: displayName, categories: next },
      { onConflict: 'shoe_ref,user_id' }
    )

    setCategoryCounts(prev => {
      const c = { ...prev }
      if (isSelected) c[cat] = Math.max(0, (c[cat] ?? 0) - 1)
      else c[cat] = (c[cat] ?? 0) + 1
      return c
    })
    setCatVoters(prev => {
      const hadCats = myCategories.length > 0
      const hasCats = next.length > 0
      if (!hadCats && hasCats) return prev + 1
      if (hadCats && !hasCats) return Math.max(0, prev - 1)
      return prev
    })
    setMyCategories(next)
    setCatBusy(false)
  }

  if (loading) return null

  const hasVotes = Object.values(community).some(c => Object.values(c).some(n => n > 0))
  const hasCatVotes = catVoters > 0
  if (!hasVotes && !hasCatVotes && !userId) return null

  return (
    <div className="luxury-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)]">
        <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium">Fit & Feel</p>
      </div>

      {/* ── Categories ── */}
      <div className="px-5 py-4 space-y-4 border-b border-[var(--border)]">
        <div className="flex items-center justify-between">
          <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium">Category</p>
          {hasCatVotes && (
            <span className="text-[0.58rem] text-[var(--stone-light)]">{catVoters} {catVoters === 1 ? 'voter' : 'voters'}</span>
          )}
        </div>

        {CATEGORY_GROUPS.map(group => (
          <div key={group.label} className="space-y-1.5">
            <p className="text-[0.58rem] tracking-[0.1em] text-[var(--stone-light)] uppercase">{group.label}</p>
            {group.items.map(cat => {
              const count = categoryCounts[cat.value] ?? 0
              const pct = catVoters > 0 ? Math.round((count / catVoters) * 100) : 0
              const isSelected = myCategories.includes(cat.value)

              return (
                <div
                  key={cat.value}
                  onClick={() => userId && !catBusy && toggleCategory(cat.value)}
                  className={`flex items-center gap-2 py-0.5 rounded-sm transition-colors ${
                    userId ? 'cursor-pointer hover:bg-[var(--bg-subtle)] -mx-1 px-1' : ''
                  }`}
                >
                  {userId && (
                    <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                      isSelected
                        ? 'bg-[var(--ink)] border-[var(--ink)]'
                        : 'border-[var(--border-strong)] bg-white'
                    }`}>
                      {isSelected && <div className="w-1 h-1 rounded-full bg-white" />}
                    </div>
                  )}
                  <span className={`text-[0.65rem] w-24 shrink-0 transition-colors ${
                    isSelected
                      ? 'text-[var(--ink)] font-semibold'
                      : count > 0
                        ? 'text-[var(--ink-mid)]'
                        : 'text-[var(--stone)]'
                  }`}>
                    {cat.label}
                  </span>
                  <div className="flex-1 h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isSelected ? 'bg-[var(--ink)]' : 'bg-[var(--stone-light)]'}`}
                      style={{ width: pct > 0 ? `${pct}%` : '0%' }}
                    />
                  </div>
                  <span className="text-[0.6rem] tabular-nums text-[var(--stone-light)] w-4 text-right shrink-0">
                    {count > 0 ? count : ''}
                  </span>
                  <span className="text-[0.58rem] tabular-nums text-[var(--stone-light)] w-7 text-right shrink-0">
                    {pct > 0 ? `${pct}%` : ''}
                  </span>
                </div>
              )
            })}
          </div>
        ))}

        {!userId && !hasCatVotes && (
          <p className="text-[0.62rem] text-[var(--stone-light)]">No votes yet</p>
        )}
      </div>

      {/* ── Fit attributes ── */}
      <div className="divide-y divide-[var(--border)]">
        {ATTRS.map(attr => {
          const counts = community[attr.key]
          const total = Object.values(counts).reduce((s, n) => s + n, 0)
          const myVal = mine[attr.key]
          const topVal = total > 0
            ? attr.options.reduce((a, b) => (counts[b.value] ?? 0) > (counts[a.value] ?? 0) ? b : a).value
            : null

          return (
            <div key={attr.key} className="px-5 py-4 space-y-3">
              <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium">
                {attr.label}
              </p>

              {total > 0 && (
                <div className="space-y-2">
                  <p className="text-[0.58rem] tracking-[0.08em] text-[var(--stone-light)] uppercase">
                    Community · {total} {total === 1 ? 'vote' : 'votes'}
                  </p>
                  {attr.options.map(opt => {
                    const count = counts[opt.value] ?? 0
                    const pct = Math.round((count / total) * 100)
                    const isTop = opt.value === topVal && count > 0
                    return (
                      <div key={opt.value} className="flex items-center gap-2">
                        <span className={`text-[0.62rem] w-14 shrink-0 ${isTop ? 'text-[var(--ink)] font-semibold' : 'text-[var(--stone)]'}`}>
                          {opt.label}
                        </span>
                        <div className="flex-1 h-1 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isTop ? 'bg-[var(--ink)]' : 'bg-[var(--stone-light)]'}`}
                            style={{ width: pct > 0 ? `${pct}%` : '2px' }}
                          />
                        </div>
                        <span className={`text-[0.6rem] tabular-nums w-5 text-right ${isTop ? 'text-[var(--ink)] font-medium' : 'text-[var(--stone-light)]'}`}>
                          {count}
                        </span>
                        <span className="text-[0.58rem] text-[var(--stone-light)] tabular-nums w-7 text-right">
                          {pct > 0 ? `${pct}%` : ''}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {userId && (
                <div className="flex items-center gap-2.5">
                  <span className="text-[0.58rem] tracking-[0.08em] text-[var(--stone-light)] uppercase shrink-0">
                    My Pick
                  </span>
                  <div className="flex gap-1.5">
                    {attr.options.map(opt => {
                      const selected = myVal === opt.value
                      return (
                        <button
                          key={opt.value}
                          onClick={() => pick(attr.key, opt.value)}
                          disabled={busy === attr.key}
                          className={`px-2.5 py-0.5 text-[0.65rem] tracking-wide border transition-all rounded-sm ${
                            selected
                              ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                              : 'bg-transparent text-[var(--stone)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]'
                          } disabled:opacity-40 disabled:cursor-default`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!userId && (
        <p className="text-[0.62rem] text-[var(--stone-light)] text-center py-3 border-t border-[var(--border)]">
          Sign in to share your fit & feel
        </p>
      )}
    </div>
  )
}
