'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Archive, ExternalLink, Pencil, Database, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Shoe, Run } from '@/lib/types'
import MileageBar from '@/components/MileageBar'
import AddRunModal from '@/components/AddRunModal'
import EditShoeModal from '@/components/EditShoeModal'
import ShoeComments from '@/components/ShoeComments'
import { StarDisplay, StarInput } from '@/components/StarRating'

export default function ShoeDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()

  const [shoe, setShoe] = useState<Shoe | null>(null)
  const [runs, setRuns] = useState<Run[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddRun, setShowAddRun] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loadingSpecs, setLoadingSpecs] = useState(false)
  const [specsLoaded, setSpecsLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [myRating, setMyRating] = useState<number | null>(null)
  const [communityRating, setCommunityRating] = useState<{ avg: number; count: number } | null>(null)
  const [savingRating, setSavingRating] = useState(false)

  useEffect(() => {
    load()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function load() {
    setLoading(true)
    const [{ data: shoeData }, { data: runsData }, { data: { user } }] = await Promise.all([
      supabase.from('shoes').select('*').eq('id', id).single(),
      supabase.from('runs').select('*').eq('shoe_id', id).order('date', { ascending: false }),
      supabase.auth.getUser(),
    ])
    let loadedShoe = shoeData as Shoe
    if (loadedShoe && !loadedShoe.image_url) {
      const { data: cw } = await supabase
        .from('shoe_colorways')
        .select('image_url')
        .ilike('brand', loadedShoe.brand)
        .ilike('model', loadedShoe.model)
        .not('image_url', 'is', null)
        .limit(1)
        .maybeSingle()
      if (cw?.image_url) loadedShoe = { ...loadedShoe, image_url: cw.image_url }
    }
    setShoe(loadedShoe)
    setRuns((runsData as Run[]) || [])
    setUserId(user?.id ?? null)
    setUserEmail(user?.email ?? null)
    setLoading(false)

    // Load ratings
    if (loadedShoe) {
      const ref = loadedShoe.sneaker_db_id || `${loadedShoe.brand}|${loadedShoe.model}`.toLowerCase()
      const { data: ratingRows } = await supabase
        .from('shoe_ratings')
        .select('user_id, rating')
        .eq('shoe_ref', ref)
      type RRow = { user_id: string; rating: number }
      if (ratingRows && ratingRows.length > 0) {
        const sum = (ratingRows as RRow[]).reduce((s, r) => s + Number(r.rating), 0)
        setCommunityRating({ avg: parseFloat((sum / ratingRows.length).toFixed(2)), count: ratingRows.length })
        const mine = (ratingRows as RRow[]).find(r => r.user_id === user?.id)
        setMyRating(mine ? Number(mine.rating) : null)
      } else {
        setCommunityRating(null)
        setMyRating(null)
      }
    }
  }

  async function handleRate(newRating: number | null) {
    if (!shoe || !userId) return
    setSavingRating(true)
    const ref = shoe.sneaker_db_id || `${shoe.brand}|${shoe.model}`.toLowerCase()
    const displayName = userEmail?.split('@')[0] ?? 'Runner'
    if (newRating === null) {
      await supabase.from('shoe_ratings').delete().eq('shoe_ref', ref).eq('user_id', userId)
      setMyRating(null)
    } else {
      await supabase.from('shoe_ratings').upsert(
        { shoe_ref: ref, user_id: userId, display_name: displayName, rating: newRating, updated_at: new Date().toISOString() },
        { onConflict: 'shoe_ref,user_id' }
      )
      setMyRating(newRating)
    }
    // Refresh community rating
    const { data: ratingRows } = await supabase
      .from('shoe_ratings')
      .select('rating')
      .eq('shoe_ref', ref)
    if (ratingRows && ratingRows.length > 0) {
      const sum = (ratingRows as { rating: number }[]).reduce((s, r) => s + Number(r.rating), 0)
      setCommunityRating({ avg: parseFloat((sum / ratingRows.length).toFixed(2)), count: ratingRows.length })
    } else {
      setCommunityRating(null)
    }
    setSavingRating(false)
  }

  async function toggleRetired() {
    if (!shoe) return
    const res = await fetch('/api/shoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: shoe.id, is_retired: !shoe.is_retired }),
    })
    if (res.ok) setShoe({ ...shoe, is_retired: !shoe.is_retired })
  }

  async function deleteRun(runId: string, distance: number) {
    const { error } = await supabase.from('runs').delete().eq('id', runId)
    if (error) return
    await fetch('/api/shoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, current_mileage: Math.max(0, (shoe?.current_mileage || 0) - distance) }),
    })
    await load()
  }

  async function deleteShoe() {
    if (!confirm('Delete this shoe and all its run records?')) return
    setDeleting(true)
    await supabase.from('shoes').delete().eq('id', id)
    router.push('/')
  }

  async function loadSpecsFromDB() {
    if (!shoe) return
    setLoadingSpecs(true)
    const params = new URLSearchParams()
    if (shoe.sneaker_db_id) params.set('id', shoe.sneaker_db_id)
    else { params.set('brand', shoe.brand); params.set('model', shoe.model) }

    const res = await fetch(`/api/shoe-specs?${params}`)
    if (!res.ok) { setLoadingSpecs(false); return }
    const data = await res.json()

    const updatedSpecs = {
      ...shoe.specs,
      ...(data.weight && { weight: data.weight }),
      ...(data.drop && { drop: data.drop }),
      ...(data.stack_height && { stack_height: data.stack_height }),
      ...(data.cushioning && { cushioning: data.cushioning }),
    }

    await fetch('/api/shoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: shoe.id, specs: updatedSpecs }),
    })

    setShoe({ ...shoe, specs: updatedSpecs })
    setSpecsLoaded(true)
    setLoadingSpecs(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-subtle)]">
        <div className="w-6 h-6 border border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!shoe) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-subtle)]">
        <div className="text-center">
          <p className="text-[var(--stone)] mb-5">Shoe not found</p>
          <Link href="/" className="btn-secondary py-2 px-5">Back to Collection</Link>
        </div>
      </div>
    )
  }

  const pct = Math.min((shoe.current_mileage / shoe.max_mileage) * 100, 100)

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[var(--border)] bg-white sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/" className="text-[var(--stone)] hover:text-[var(--ink)] transition-colors">
            <ArrowLeft size={17} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium">{shoe.brand}</p>
            <p className="text-sm font-semibold text-[var(--ink)] truncate">{shoe.nickname || shoe.model}</p>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setShowEdit(true)}
              title="Edit shoe"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--stone)] hover:text-[var(--ink)] transition-colors"
            >
              <Pencil size={15} />
            </button>
            <button
              onClick={toggleRetired}
              title={shoe.is_retired ? 'Reactivate' : 'Retire shoe'}
              className={`min-w-[44px] min-h-[44px] flex items-center justify-center transition-colors ${shoe.is_retired ? 'text-[var(--safe)]' : 'text-[var(--stone)] hover:text-[var(--warn)]'}`}
            >
              <Archive size={15} />
            </button>
            <button
              onClick={deleteShoe}
              disabled={deleting}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center text-[var(--stone)] hover:text-[var(--danger)] transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        {/* Hero */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Image */}
          <div className={`luxury-card overflow-hidden relative ${shoe.is_retired ? 'retired-overlay' : ''}`}>
            {shoe.image_url ? (
              <div className="relative h-64 bg-white">
                <Image
                  src={shoe.image_url}
                  alt={`${shoe.brand} ${shoe.model}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  className="object-contain p-4 mix-blend-multiply"
                />
              </div>
            ) : (
              <div className="h-64 bg-white flex items-center justify-center text-6xl opacity-10">👟</div>
            )}

            {shoe.is_retired && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[var(--stone)] text-[0.6rem] font-semibold tracking-[0.2em] uppercase border border-[var(--border-strong)] px-4 py-1.5 bg-white rotate-[-12deg]">
                  Retired
                </span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <div className="luxury-card p-6 space-y-5">
              <div>
                <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium mb-1">Full Name</p>
                <p className="font-semibold text-[var(--ink)]">{shoe.brand} {shoe.model}</p>
                {shoe.nickname && (
                  <p className="text-sm text-[var(--stone)] mt-0.5">&ldquo;{shoe.nickname}&rdquo;</p>
                )}
              </div>

              {(shoe.color || shoe.size) && (
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {shoe.color && (
                    <div>
                      <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium mb-0.5">Color</p>
                      <p className="text-[var(--ink-mid)]">{shoe.color}</p>
                    </div>
                  )}
                  {shoe.size && (
                    <div>
                      <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium mb-0.5">Size</p>
                      <p className="text-[var(--ink-mid)]">{shoe.size}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border)]">
                <div className="flex justify-between items-baseline mb-3">
                  <span className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium">Mileage</span>
                  <span className={`text-lg font-black ${pct >= 90 ? 'text-[var(--danger)]' : pct >= 70 ? 'text-[var(--warn)]' : 'text-[var(--ink)]'}`}>
                    {shoe.current_mileage.toFixed(0)}{' '}
                    <span className="text-xs font-normal text-[var(--stone)]">/ {shoe.max_mileage} km</span>
                  </span>
                </div>
                <MileageBar current={shoe.current_mileage} max={shoe.max_mileage} />
                <p className="text-[0.68rem] text-[var(--stone)] mt-2">
                  {shoe.max_mileage - shoe.current_mileage > 0
                    ? `${(shoe.max_mileage - shoe.current_mileage).toFixed(0)} km remaining`
                    : 'Recommended mileage exceeded'}
                </p>
              </div>

              <button
                onClick={() => setShowAddRun(true)}
                disabled={shoe.is_retired}
                className="btn-primary w-full justify-center py-2.5"
              >
                <Plus size={13} />
                Log Run
              </button>
            </div>

            {/* Physical Specs — always visible */}
            <div className="luxury-card">
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)]">
                <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium">
                  Physical Specs
                </p>
                <div className="flex items-center gap-3">
                  {!shoe.specs?.weight && !specsLoaded && (
                    <button
                      onClick={loadSpecsFromDB}
                      disabled={loadingSpecs}
                      className="text-[0.62rem] text-[var(--stone)] hover:text-[var(--ink)] transition-colors flex items-center gap-1 disabled:opacity-40"
                    >
                      {loadingSpecs ? (
                        <><Loader2 size={10} className="animate-spin" /> Loading...</>
                      ) : (
                        <><Database size={10} /> Load from DB</>
                      )}
                    </button>
                  )}
                  <button
                    onClick={() => setShowEdit(true)}
                    className="text-[0.62rem] text-[var(--stone)] hover:text-[var(--ink)] transition-colors flex items-center gap-1"
                  >
                    <Pencil size={11} />
                    Edit
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 divide-x divide-[var(--border)]">
                {[
                  { label: 'Weight', value: shoe.specs?.weight },
                  { label: 'Drop', value: shoe.specs?.drop },
                  { label: 'Stack', value: shoe.specs?.stack_height },
                ].map(({ label, value }) => (
                  <div key={label} className="px-4 py-4 text-center">
                    <p className="text-[0.58rem] tracking-[0.12em] text-[var(--stone)] uppercase font-medium mb-1.5">
                      {label}
                    </p>
                    {value ? (
                      <p className="text-base font-semibold text-[var(--ink)]">{value}</p>
                    ) : (
                      <p className="text-base text-[var(--stone-light)]">—</p>
                    )}
                  </div>
                ))}
              </div>
              {specsLoaded && (
                <p className="text-[0.6rem] text-[var(--stone)] text-center py-2 border-t border-[var(--border)] tracking-wide">
                  Reference values loaded · Edit to adjust
                </p>
              )}
            </div>

            {/* Extra specs — conditional */}
            {shoe.specs && (shoe.specs.purchase_price || shoe.specs.msrp || shoe.specs.releaseDate || shoe.specs.gender || shoe.specs.description || shoe.specs.cushioning) && (
              <div className="luxury-card p-5">
                <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium mb-3 flex items-center gap-2">
                  Details
                  {shoe.sneaker_db_id && <ExternalLink size={10} className="text-[var(--stone-light)]" />}
                </p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {shoe.specs.purchase_price != null && (
                    <div>
                      <p className="text-[var(--stone)] mb-0.5">Purchase Price</p>
                      <p className="text-[var(--ink-mid)] font-medium">
                        {shoe.specs.purchase_currency === 'KRW'
                          ? `₩${shoe.specs.purchase_price.toLocaleString('ko-KR')}`
                          : shoe.specs.purchase_currency === 'USD'
                          ? `$${shoe.specs.purchase_price.toLocaleString()}`
                          : shoe.specs.purchase_currency === 'EUR'
                          ? `€${shoe.specs.purchase_price.toLocaleString()}`
                          : shoe.specs.purchase_currency === 'JPY'
                          ? `¥${shoe.specs.purchase_price.toLocaleString('ja-JP')}`
                          : shoe.specs.purchase_currency === 'GBP'
                          ? `£${shoe.specs.purchase_price.toLocaleString()}`
                          : `${shoe.specs.purchase_currency} ${shoe.specs.purchase_price.toLocaleString()}`}
                      </p>
                    </div>
                  )}
                  {shoe.specs.msrp && (
                    <div>
                      <p className="text-[var(--stone)] mb-0.5">Retail Price</p>
                      <p className="text-[var(--ink-mid)] font-medium">${shoe.specs.msrp}</p>
                    </div>
                  )}
                  {shoe.specs.releaseDate && (
                    <div>
                      <p className="text-[var(--stone)] mb-0.5">Released</p>
                      <p className="text-[var(--ink-mid)] font-medium">{shoe.specs.releaseDate}</p>
                    </div>
                  )}
                  {shoe.specs.gender && (
                    <div>
                      <p className="text-[var(--stone)] mb-0.5">Gender</p>
                      <p className="text-[var(--ink-mid)] font-medium capitalize">{shoe.specs.gender}</p>
                    </div>
                  )}
                  {shoe.specs.cushioning && (
                    <div>
                      <p className="text-[var(--stone)] mb-0.5">Cushioning</p>
                      <p className="text-[var(--ink-mid)] font-medium">{shoe.specs.cushioning}</p>
                    </div>
                  )}
                </div>
                {shoe.specs.description && (
                  <p className="text-xs text-[var(--stone)] mt-3 leading-relaxed border-t border-[var(--border)] pt-3">
                    {shoe.specs.description}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rating */}
        <div className="luxury-card overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[var(--border)]">
            <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium">Rating</p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-[var(--border)]">
            {/* Community */}
            <div className="px-5 py-4">
              <p className="text-[0.58rem] tracking-[0.12em] text-[var(--stone-light)] uppercase font-medium mb-2.5">Community</p>
              {communityRating ? (
                <div className="space-y-1">
                  <StarDisplay value={communityRating.avg} count={communityRating.count} size="md" />
                  <p className="text-[0.62rem] text-[var(--stone-light)]">
                    avg {communityRating.avg.toFixed(1)} / 5
                  </p>
                </div>
              ) : (
                <p className="text-xs text-[var(--stone-light)]">No ratings yet</p>
              )}
            </div>

            {/* My rating */}
            <div className="px-5 py-4">
              <p className="text-[0.58rem] tracking-[0.12em] text-[var(--stone-light)] uppercase font-medium mb-2.5">My Rating</p>
              {userId ? (
                <div className="space-y-2">
                  <StarInput value={myRating} onRate={handleRate} size="sm" />
                  {savingRating ? (
                    <p className="text-[0.62rem] text-[var(--stone-light)]">Saving…</p>
                  ) : myRating ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[0.62rem] text-[var(--stone)]">{myRating.toFixed(1)} / 5</span>
                      <button
                        onClick={() => handleRate(null)}
                        className="text-[0.58rem] text-[var(--stone-light)] hover:text-[var(--danger)] transition-colors underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <p className="text-[0.62rem] text-[var(--stone-light)]">Tap stars to rate</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-[var(--stone-light)]">Sign in to rate</p>
              )}
            </div>
          </div>
        </div>

        {/* Comments */}
        {shoe && (
          <ShoeComments
            shoeRef={shoe.sneaker_db_id || `${shoe.brand}|${shoe.model}`.toLowerCase()}
            currentUserId={userId}
            currentUserEmail={userEmail}
          />
        )}

        {/* Run History */}
        <section>
          <div className="flex items-center gap-4 mb-6">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <h2 className="text-[0.62rem] tracking-[0.28em] text-[var(--stone)] uppercase font-medium">
              Run History ({runs.length})
            </h2>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {runs.length === 0 ? (
            <div className="luxury-card p-10 text-center">
              <p className="text-[var(--stone)] text-sm">No runs logged yet</p>
              {!shoe.is_retired && (
                <button
                  onClick={() => setShowAddRun(true)}
                  className="btn-secondary mt-5 py-2 px-6"
                >
                  Log first run
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {runs.map(run => (
                <div key={run.id} className="luxury-card px-5 py-3.5 flex items-center gap-5">
                  <div className="text-[0.68rem] text-[var(--stone)] w-20 shrink-0 font-medium">
                    {new Date(run.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', year: '2-digit' })}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-base font-bold text-[var(--ink)]">{run.distance}</span>
                      <span className="text-xs text-[var(--stone)]">km</span>
                    </div>
                    {run.notes && <p className="text-xs text-[var(--stone)] truncate mt-0.5">{run.notes}</p>}
                  </div>
                  <button
                    onClick={() => deleteRun(run.id, run.distance)}
                    className="text-[var(--stone-light)] hover:text-[var(--danger)] transition-colors shrink-0 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {showAddRun && (
        <AddRunModal
          shoeId={id}
          onClose={() => setShowAddRun(false)}
          onAdded={load}
        />
      )}

      {showEdit && shoe && (
        <EditShoeModal
          shoe={shoe}
          onClose={() => setShowEdit(false)}
          onSaved={(updated) => {
            setShoe(updated)
            setShowEdit(false)
          }}
        />
      )}
    </div>
  )
}
