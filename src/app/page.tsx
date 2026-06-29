'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, LogOut, PieChart } from 'lucide-react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
} from '@dnd-kit/sortable'
import { createClient } from '@/lib/supabase/client'
import { Shoe } from '@/lib/types'
import ShoeCard from '@/components/ShoeCard'
import SortableShoeCard from '@/components/SortableShoeCard'
import AddShoeModal from '@/components/AddShoeModal'
import SummaryModal from '@/components/SummaryModal'

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()

  const [shoes, setShoes] = useState<Shoe[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [showSummary, setShowSummary] = useState(false)
  const [ratingMap, setRatingMap] = useState<Record<string, { avg: number; count: number }>>({})
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)

  // Require 8px movement before drag starts — prevents accidental drags on tap
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserEmail(user.email ?? '')
      setUserId(user.id)
      await loadShoes()
    }
    init()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function loadShoes() {
    setLoading(true)
    const { data } = await supabase
      .from('shoes')
      .select('*')
      .order('sort_order', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
    let loaded = (data as Shoe[]) || []

    // For shoes missing an image, fall back to the community colorways pool
    const noImg = loaded.filter(s => !s.image_url)
    if (noImg.length > 0) {
      const pairs = [
        ...new Map(
          noImg.map(s => [`${s.brand.toLowerCase()}|${s.model.toLowerCase()}`, { brand: s.brand, model: s.model }])
        ).values(),
      ]
      const fallbacks: Record<string, string> = {}
      await Promise.all(
        pairs.map(async ({ brand, model }) => {
          const { data: cw } = await supabase
            .from('shoe_colorways')
            .select('image_url')
            .ilike('brand', brand)
            .ilike('model', model)
            .not('image_url', 'is', null)
            .limit(1)
            .maybeSingle()
          if (cw?.image_url)
            fallbacks[`${brand.toLowerCase()}|${model.toLowerCase()}`] = cw.image_url
        })
      )
      loaded = loaded.map(s => {
        if (s.image_url) return s
        const key = `${s.brand.toLowerCase()}|${s.model.toLowerCase()}`
        return fallbacks[key] ? { ...s, image_url: fallbacks[key] } : s
      })
    }

    setShoes(loaded)
    setLoading(false)
    loadRatings(loaded)
  }

  async function loadRatings(loaded: Shoe[]) {
    if (loaded.length === 0) return
    const refs = [...new Set(
      loaded.map(s => s.sneaker_db_id || `${s.brand}|${s.model}`.toLowerCase())
    )]
    const { data } = await supabase
      .from('shoe_ratings')
      .select('shoe_ref, rating')
      .in('shoe_ref', refs)

    const sums: Record<string, { sum: number; count: number }> = {}
    data?.forEach((r: { shoe_ref: string; rating: number }) => {
      if (!sums[r.shoe_ref]) sums[r.shoe_ref] = { sum: 0, count: 0 }
      sums[r.shoe_ref].sum += Number(r.rating)
      sums[r.shoe_ref].count++
    })
    const map: Record<string, { avg: number; count: number }> = {}
    Object.entries(sums).forEach(([ref, { sum, count }]) => {
      map[ref] = { avg: parseFloat((sum / count).toFixed(2)), count }
    })
    setRatingMap(map)
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function setRetired(shoeId: string, retired: boolean) {
    await supabase.from('shoes').update({ is_retired: retired }).eq('id', shoeId)
    await loadShoes()
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeShoes = shoes.filter(s => !s.is_retired)
    const oldIndex = activeShoes.findIndex(s => s.id === active.id)
    const newIndex = activeShoes.findIndex(s => s.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(activeShoes, oldIndex, newIndex)
    const retired = shoes.filter(s => s.is_retired)

    // Optimistic update
    setShoes([...reordered, ...retired])

    // Persist to DB
    await Promise.all(
      reordered.map((s, index) => supabase.from('shoes').update({ sort_order: index }).eq('id', s.id))
    )
  }

  const activeShoes = shoes.filter(s => !s.is_retired)
  const retiredShoes = shoes.filter(s => s.is_retired)
  const totalMileage = shoes.reduce((acc, s) => acc + s.current_mileage, 0)
  const activeShoe = activeId ? shoes.find(s => s.id === activeId) : null

  const shelfRows: Shoe[][] = []
  for (let i = 0; i < activeShoes.length; i += 3) {
    shelfRows.push(activeShoes.slice(i, i + 3))
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="safe-area-top border-b border-[var(--border)] bg-white sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <h1 className="text-base font-black tracking-[0.25em] text-[var(--ink)]">
            SOLEMATE
          </h1>

          <div className="flex items-center gap-5">
            <div className="hidden sm:flex items-center gap-6 text-xs">
              <div>
                <span className="text-[var(--stone)]">Shoes </span>
                <span className="text-[var(--ink)] font-bold">{shoes.length}</span>
              </div>
              <div>
                <span className="text-[var(--stone)]">Total km </span>
                <span className="text-[var(--ink)] font-bold">{totalMileage.toFixed(0)}</span>
              </div>
            </div>

            {shoes.length > 0 && (
              <button
                onClick={() => setShowSummary(true)}
                title="Running Summary"
                className="btn-secondary py-2 px-3.5 text-[0.65rem]"
              >
                <PieChart size={13} />
                <span className="hidden sm:inline">Summarize</span>
              </button>
            )}

            <button
              onClick={() => setShowAdd(true)}
              className="btn-primary py-2 px-4 text-[0.65rem]"
            >
              <Plus size={13} />
              <span className="hidden sm:inline">Add Shoe</span>
            </button>

            <button
              onClick={signOut}
              title={userEmail}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--stone)] hover:text-[var(--ink)] transition-colors"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-10 sm:space-y-16">
        {loading ? (
          <div className="flex items-center justify-center py-28">
            <div className="text-center space-y-4">
              <div className="w-6 h-6 border border-[var(--ink)] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-[0.65rem] tracking-widest text-[var(--stone)] uppercase">Loading collection...</p>
            </div>
          </div>
        ) : shoes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-8">
            <div className="text-6xl opacity-10 select-none">👟</div>
            <div className="text-center space-y-2">
              <p className="text-[var(--ink)] font-medium">Your collection is empty</p>
              <p className="text-xs text-[var(--stone)]">Add your first running shoe to get started</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="btn-primary py-3 px-8">
              <Plus size={14} />
              Add First Shoe
            </button>
          </div>
        ) : (
          <>
            {/* Active Collection */}
            <section>
              <div className="flex items-center gap-4 mb-8 sm:mb-10">
                <div className="h-px flex-1 bg-[var(--border)]" />
                <h2 className="text-[0.62rem] tracking-[0.28em] text-[var(--stone)] uppercase font-medium">
                  Active Collection
                </h2>
                <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeShoes.map(s => s.id)}
                  strategy={rectSortingStrategy}
                >
                  <div className="space-y-12 sm:space-y-20">
                    {shelfRows.map((row, rowIdx) => (
                      <div key={rowIdx} className="shoe-shelf pb-8">
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-5">
                          {row.map(shoe => {
                            const ref = shoe.sneaker_db_id || `${shoe.brand}|${shoe.model}`.toLowerCase()
                            return (
                              <SortableShoeCard
                                key={shoe.id}
                                shoe={shoe}
                                onRetire={() => setRetired(shoe.id, true)}
                                ratingInfo={ratingMap[ref]}
                              />
                            )
                          })}
                          {rowIdx === shelfRows.length - 1 && row.length < 3 && (
                            <button
                              onClick={() => setShowAdd(true)}
                              className="luxury-card border-dashed flex flex-col items-center justify-center min-h-[220px] text-[var(--stone-light)] hover:text-[var(--stone)] hover:border-[var(--border-strong)] transition-all group"
                            >
                              <Plus size={20} className="mb-2 group-hover:scale-105 transition-transform" />
                              <span className="text-[0.6rem] tracking-[0.15em] uppercase">Add Shoe</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {activeShoes.length > 0 && activeShoes.length % 3 === 0 && (
                      <div className="flex justify-center">
                        <button onClick={() => setShowAdd(true)} className="btn-secondary py-2.5 px-8">
                          <Plus size={13} />
                          Add Another Shoe
                        </button>
                      </div>
                    )}
                  </div>
                </SortableContext>

                {/* Ghost card shown under cursor while dragging */}
                <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
                  {activeShoe ? (
                    <div className="rotate-1 scale-105 shadow-2xl">
                      <ShoeCard shoe={activeShoe} />
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            </section>

            {/* Retired Collection */}
            {retiredShoes.length > 0 && (
              <section>
                <div className="flex items-center gap-4 mb-8">
                  <div className="h-px flex-1 bg-[var(--border)]" />
                  <h2 className="text-[0.62rem] tracking-[0.28em] text-[var(--stone)] uppercase font-medium">
                    Retired Collection
                  </h2>
                  <div className="h-px flex-1 bg-[var(--border)]" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
                  {retiredShoes.map(shoe => {
                    const ref = shoe.sneaker_db_id || `${shoe.brand}|${shoe.model}`.toLowerCase()
                    return (
                      <ShoeCard
                        key={shoe.id}
                        shoe={shoe}
                        onReactivate={() => setRetired(shoe.id, false)}
                        ratingInfo={ratingMap[ref]}
                      />
                    )
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {showAdd && (
        <AddShoeModal onClose={() => setShowAdd(false)} onAdded={loadShoes} />
      )}

      {showSummary && (
        <SummaryModal shoes={activeShoes} onClose={() => setShowSummary(false)} />
      )}
    </div>
  )
}
