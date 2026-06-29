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

  useEffect(() => {
    async function loadData() {
      const { data } = await supabase
        .from('shoe_ratings')
        .select('user_id, toe_box, midsole_feel, outsole_grip, breathability, durability')
        .eq('shoe_ref', shoeRef)

      if (!data) { setLoading(false); return }

      const counts = buildEmpty()
      for (const row of data as Record<string, string | null>[]) {
        for (const a of ATTRS) {
          const v = row[a.key]
          if (v && v in counts[a.key]) counts[a.key][v]++
        }
      }
      setCommunity(counts)

      if (userId) {
        const myRow = (data as Record<string, string | null>[]).find(r => r.user_id === userId)
        if (myRow) {
          setMine({
            toe_box: myRow.toe_box ?? null,
            midsole_feel: myRow.midsole_feel ?? null,
            outsole_grip: myRow.outsole_grip ?? null,
            breathability: myRow.breathability ?? null,
            durability: myRow.durability ?? null,
          })
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

  if (loading) return null

  const hasVotes = Object.values(community).some(c => Object.values(c).some(n => n > 0))
  if (!hasVotes && !userId) return null

  return (
    <div className="luxury-card overflow-hidden">
      <div className="px-5 py-3.5 border-b border-[var(--border)]">
        <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium">Fit & Feel</p>
      </div>
      <div className="divide-y divide-[var(--border)]">
        {ATTRS.map(attr => {
          const counts = community[attr.key]
          const myVal = mine[attr.key]
          return (
            <div key={attr.key} className="px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="text-[0.6rem] tracking-[0.12em] text-[var(--stone)] uppercase font-medium w-28 shrink-0">
                  {attr.label}
                </span>
                <div className="flex gap-1.5 flex-wrap">
                  {attr.options.map(opt => {
                    const selected = myVal === opt.value
                    const count = counts[opt.value] ?? 0
                    return (
                      <button
                        key={opt.value}
                        onClick={() => pick(attr.key, opt.value)}
                        disabled={!userId || busy === attr.key}
                        className={`px-2.5 py-0.5 text-[0.65rem] tracking-wide border transition-all rounded-sm ${
                          selected
                            ? 'bg-[var(--ink)] text-white border-[var(--ink)]'
                            : 'bg-transparent text-[var(--stone)] border-[var(--border)] hover:border-[var(--border-strong)] hover:text-[var(--ink)]'
                        } disabled:opacity-40 disabled:cursor-default`}
                      >
                        {opt.label}
                        {count > 0 && (
                          <span className={`ml-1 tabular-nums text-[0.58rem] ${selected ? 'opacity-60' : 'text-[var(--stone-light)]'}`}>
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
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
