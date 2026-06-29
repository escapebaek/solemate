'use client'

import { useState } from 'react'
import { X, Search, Loader2, Check, ChevronDown, ChevronUp, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { API_BASE } from '@/lib/api'
import { SneakerSearchResult } from '@/lib/types'
import Image from 'next/image'

interface AddShoeModalProps {
  onClose: () => void
  onAdded: () => void
}

interface Colorway {
  id: string
  color: string
  image_url: string | null
  isDefault?: boolean
}

function ColorwayCard({
  colorway,
  isSelected,
  onSelect,
}: {
  colorway: Colorway
  isSelected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative border-2 h-24 overflow-hidden transition-all ${
        isSelected
          ? 'border-[var(--ink)] shadow-sm'
          : 'border-[var(--border)] hover:border-[var(--border-strong)]'
      }`}
    >
      {colorway.image_url ? (
        <Image
          src={colorway.image_url}
          alt={colorway.color}
          fill
          className="object-contain p-1 mix-blend-multiply"
          unoptimized
        />
      ) : (
        <div className="h-full flex items-center justify-center text-3xl opacity-15">👟</div>
      )}
      <div className="absolute bottom-0 left-0 right-0 bg-white/90 px-1.5 py-1">
        <p className="text-[0.58rem] text-[var(--stone)] truncate leading-none">
          {colorway.color || 'Default'}
        </p>
        {colorway.isDefault && (
          <p className="text-[0.52rem] text-[var(--stone-light)] leading-none mt-0.5">DB default</p>
        )}
      </div>
      {isSelected && (
        <div className="absolute top-1 right-1 bg-white rounded-full w-4 h-4 flex items-center justify-center border border-[var(--ink)]">
          <Check size={9} strokeWidth={3} className="text-[var(--ink)]" />
        </div>
      )}
    </button>
  )
}

export default function AddShoeModal({ onClose, onAdded }: AddShoeModalProps) {
  const supabase = createClient()

  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SneakerSearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selected, setSelected] = useState<SneakerSearchResult | null>(null)
  const [searchOpen, setSearchOpen] = useState(false)

  // Colorway picker
  const [colorways, setColorways] = useState<Colorway[]>([])
  const [loadingColorways, setLoadingColorways] = useState(false)
  const [selectedColorway, setSelectedColorway] = useState<Colorway | null>(null)
  const [addingNewColor, setAddingNewColor] = useState(false)
  const [newColorName, setNewColorName] = useState('')
  const [newColorImageUrl, setNewColorImageUrl] = useState('')
  const [newColorImageFile, setNewColorImageFile] = useState<File | null>(null)
  const [newColorImagePreview, setNewColorImagePreview] = useState('')
  const [newColorImageMode, setNewColorImageMode] = useState<'url' | 'file'>('url')
  const [savingColorway, setSavingColorway] = useState(false)

  // Form fields
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [nickname, setNickname] = useState('')
  const [color, setColor] = useState('')
  const [size, setSize] = useState('')
  const [maxMileage, setMaxMileage] = useState('800')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageUrl, setImageUrl] = useState('')
  const [imageMode, setImageMode] = useState<'file' | 'url'>('file')

  // Physical specs
  const [weight, setWeight] = useState('')
  const [drop, setDrop] = useState('')
  const [stackHeight, setStackHeight] = useState('')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function searchSneakers() {
    if (!query.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`${API_BASE}/api/sneaker-search?q=${encodeURIComponent(query)}`)
      const data = await res.json()
      setSearchResults(data.results || [])
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  async function loadColorways(b: string, m: string, defaultCw: Colorway) {
    setLoadingColorways(true)
    const { data } = await supabase
      .from('shoe_colorways')
      .select('id, color, image_url, created_at')
      .ilike('brand', b)
      .ilike('model', m)
      .order('created_at', { ascending: true })
    const community: Colorway[] = (data || []).filter(
      (cw: Colorway) => cw.color.toLowerCase() !== (defaultCw.color || '').toLowerCase()
    )
    setColorways(community)
    setLoadingColorways(false)
  }

  function selectColorway(cw: Colorway) {
    setSelectedColorway(cw)
    setColor(cw.isDefault ? (selected?.colorway || cw.color) : cw.color)
    if (cw.image_url) {
      setImagePreview(cw.image_url)
      setImageFile(null)
    }
  }

  async function addNewColorway() {
    if (!newColorName.trim() || !selected) return
    setSavingColorway(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      let colorwayImageUrl: string | null = newColorImageUrl.trim() || null

      if (newColorImageMode === 'file' && newColorImageFile) {
        const ext = newColorImageFile.name.split('.').pop()
        const path = `${user.id}/${Date.now()}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('shoe-images')
          .upload(path, newColorImageFile)
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('shoe-images').getPublicUrl(path)
          colorwayImageUrl = urlData.publicUrl
        }
      }

      const { data: inserted, error: insertErr } = await supabase
        .from('shoe_colorways')
        .insert({
          brand: selected.brand || brand,
          model: selected.name || selected.model || model,
          color: newColorName.trim(),
          image_url: colorwayImageUrl,
          created_by: user.id,
        })
        .select('id, color, image_url')
        .single()

      if (insertErr && insertErr.code !== '23505') {
        console.error(insertErr)
        return
      }

      const newCw: Colorway = inserted ?? {
        id: `temp-${Date.now()}`,
        color: newColorName.trim(),
        image_url: colorwayImageUrl,
      }

      setColorways(prev => [...prev, newCw])
      selectColorway(newCw)
      setAddingNewColor(false)
      setNewColorName('')
      setNewColorImageUrl('')
      setNewColorImageFile(null)
      setNewColorImagePreview('')
      setNewColorImageMode('url')
    } finally {
      setSavingColorway(false)
    }
  }

  function selectSneaker(result: SneakerSearchResult) {
    setSelected(result)
    setBrand(result.brand || '')
    setModel(result.name || result.model || '')
    setWeight(result.weight ?? '')
    setDrop(result.drop ?? '')
    setStackHeight(result.stack_height ?? '')
    setSearchResults([])
    setSearchOpen(false)

    // Pre-select default colorway from DB
    const defaultCw: Colorway = {
      id: 'default',
      color: result.colorway || 'Default',
      image_url: result.thumbnail ?? null,
      isDefault: true,
    }
    setSelectedColorway(defaultCw)
    setColor(result.colorway || '')
    if (result.thumbnail) {
      setImagePreview(result.thumbnail)
      setImageFile(null)
    }

    loadColorways(result.brand || '', result.name || result.model || '', defaultCw)
  }

  function clearSelection() {
    setSelected(null)
    setImagePreview('')
    setImageUrl('')
    setBrand('')
    setModel('')
    setColor('')
    setQuery('')
    setWeight('')
    setDrop('')
    setStackHeight('')
    setColorways([])
    setSelectedColorway(null)
    setAddingNewColor(false)
    setNewColorName('')
    setNewColorImageUrl('')
  }

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setSelected(null)
    setImagePreview(URL.createObjectURL(file))
    setSelectedColorway(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brand || !model) {
      setError('Brand and model are required')
      return
    }
    setSaving(true)
    setError('')

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      setSaving(false)
      return
    }

    let finalImageUrl: string | null = null

    if (imageMode === 'url' && imageUrl.trim()) {
      finalImageUrl = imageUrl.trim()
    } else if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('shoe-images')
        .upload(path, imageFile)
      if (uploadErr) {
        setError('Image upload failed: ' + uploadErr.message)
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('shoe-images').getPublicUrl(path)
      finalImageUrl = urlData.publicUrl
    } else if (selectedColorway?.image_url) {
      finalImageUrl = selectedColorway.image_url
    } else if (selected?.thumbnail) {
      finalImageUrl = selected.thumbnail
    }

    const specs = {
      ...(selected
        ? {
            colorway: selected.colorway,
            gender: selected.gender,
            releaseDate: selected.releaseDate,
            msrp: selected.retailPrice,
            description: selected.description,
            cushioning: selected.cushioning,
          }
        : {}),
      weight: weight || undefined,
      drop: drop || undefined,
      stack_height: stackHeight || undefined,
    }
    const hasSpecs = Object.values(specs).some(v => v !== undefined)

    // Manual registration → save to community_shoes
    let communityId: string | null = null
    if (!selected) {
      const { data: existing } = await supabase
        .from('community_shoes')
        .select('id')
        .ilike('brand', brand)
        .ilike('model', model)
        .maybeSingle()

      if (existing) {
        communityId = `c-${existing.id}`
      } else {
        const { data: newEntry } = await supabase
          .from('community_shoes')
          .insert({
            brand,
            model,
            name: `${brand} ${model}`,
            colorway: color || null,
            image_url: finalImageUrl,
            weight: weight || null,
            drop: drop || null,
            stack_height: stackHeight || null,
            submitted_by: user.id,
          })
          .select('id')
          .single()
        if (newEntry) communityId = `c-${newEntry.id}`
      }
    }

    const { error: insertErr } = await supabase.from('shoes').insert({
      user_id: user.id,
      brand,
      model,
      nickname: nickname || null,
      color: color || null,
      size: size || null,
      image_url: finalImageUrl,
      max_mileage: parseFloat(maxMileage) || 800,
      current_mileage: 0,
      is_retired: false,
      specs: hasSpecs ? specs : null,
      sneaker_db_id: selected?.id || communityId || null,
    })

    if (insertErr) {
      setError(insertErr.message)
      setSaving(false)
      return
    }

    // Share image to community colorways pool so other users see it when adding the same shoe
    if (finalImageUrl && brand && model) {
      await supabase.from('shoe_colorways').insert({
        brand,
        model,
        color: color || selectedColorway?.color || selected?.colorway || 'Default',
        image_url: finalImageUrl,
        created_by: user.id,
      })
      // ignore errors (23505 = already exists for this brand+model+color, that's fine)
    }

    onAdded()
    onClose()
  }

  const allColorways: Colorway[] = selected
    ? [
        {
          id: 'default',
          color: selected.colorway || 'Default',
          image_url: selected.thumbnail ?? null,
          isDefault: true,
        },
        ...colorways,
      ]
    : []

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 modal-backdrop"
      onClick={onClose}
    >
      <div
        className="safe-area-bottom luxury-card relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[var(--border)]">
          <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ink)]">
            Add New Shoe
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--stone-light)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={17} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">

          {/* ── Database Search ── */}
          <div className="border border-[var(--border)] rounded-sm">
            <button
              type="button"
              onClick={() => setSearchOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[var(--bg-subtle)] transition-colors"
            >
              <div>
                <span className="text-xs font-semibold tracking-[0.1em] uppercase text-[var(--ink)]">
                  Search Database
                </span>
                <span className="ml-2 text-[0.65rem] text-[var(--stone)]">
                  optional — autofill details &amp; image
                </span>
              </div>
              {selected ? (
                <span className="flex items-center gap-1 text-[0.65rem] text-[var(--safe)] font-medium">
                  <Check size={12} /> Selected
                </span>
              ) : searchOpen ? (
                <ChevronUp size={15} className="text-[var(--stone)]" />
              ) : (
                <ChevronDown size={15} className="text-[var(--stone)]" />
              )}
            </button>

            {searchOpen && (
              <div className="px-4 pb-4 border-t border-[var(--border)] pt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e =>
                      e.key === 'Enter' && (e.preventDefault(), searchSneakers())
                    }
                    className="input-luxury flex-1"
                    placeholder="e.g. Nike Pegasus 41"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={searchSneakers}
                    disabled={searching}
                    className="btn-secondary px-3.5"
                  >
                    {searching ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                  </button>
                </div>

                {searchResults.length > 0 && (
                  <div className="border border-[var(--border)] divide-y divide-[var(--border)] max-h-52 overflow-y-auto bg-white shadow-sm">
                    {searchResults.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => selectSneaker(r)}
                        className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-[var(--bg-subtle)] text-left transition-colors"
                      >
                        {r.thumbnail ? (
                          <Image
                            src={r.thumbnail}
                            alt={r.name}
                            width={40}
                            height={40}
                            className="object-contain shrink-0"
                            unoptimized
                          />
                        ) : (
                          <div className="w-10 h-10 bg-[var(--bg-subtle)] flex items-center justify-center text-xl shrink-0">
                            👟
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-medium text-[var(--ink)] truncate">
                              {r.name}
                            </p>
                            {r.isCommunity && (
                              <span className="shrink-0 text-[0.55rem] font-semibold tracking-wide text-[var(--stone)] border border-[var(--border)] px-1.5 py-0.5 uppercase">
                                Community
                              </span>
                            )}
                          </div>
                          <p className="text-[0.68rem] text-[var(--stone)]">
                            {r.brand}
                            {r.colorway && ` · ${r.colorway}`}
                            {r.retailPrice && ` · $${r.retailPrice}`}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.length === 0 && query && !searching && (
                  <p className="text-[0.7rem] text-[var(--stone)] px-1">
                    No results — fill in the fields below manually.
                  </p>
                )}
              </div>
            )}

            {/* Selected preview */}
            {selected && (
              <div className="border-t border-[var(--border)] px-4 py-3 flex items-center gap-3 bg-[var(--bg-subtle)]">
                {imagePreview && (
                  <Image
                    src={imagePreview}
                    alt={selected.name}
                    width={48}
                    height={48}
                    className="object-contain shrink-0"
                    unoptimized
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-[var(--ink)] truncate">
                    {selected.name}
                  </p>
                  {color && (
                    <p className="text-[0.68rem] text-[var(--stone)]">{color}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-[var(--stone-light)] hover:text-[var(--ink)] transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* ── Colorway Picker (visible when shoe is selected from DB) ── */}
          {selected && (
            <div className="border border-[var(--border)] rounded-sm">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <p className="text-xs font-semibold tracking-[0.1em] uppercase text-[var(--ink)]">
                  Select Colorway
                </p>
                {selectedColorway && !selectedColorway.isDefault && (
                  <span className="text-[0.65rem] text-[var(--safe)] font-medium flex items-center gap-1">
                    <Check size={11} /> {selectedColorway.color}
                  </span>
                )}
              </div>

              <div className="p-4">
                {loadingColorways ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-[var(--stone)]">
                    <Loader2 size={14} className="animate-spin" />
                    <span className="text-xs">Loading colorways…</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {allColorways.map(cw => (
                      <ColorwayCard
                        key={cw.id}
                        colorway={cw}
                        isSelected={selectedColorway?.id === cw.id}
                        onSelect={() => selectColorway(cw)}
                      />
                    ))}

                    {/* Add new colorway tile */}
                    <button
                      type="button"
                      onClick={() => setAddingNewColor(v => !v)}
                      className={`h-24 border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors ${
                        addingNewColor
                          ? 'border-[var(--ink)] text-[var(--ink)]'
                          : 'border-[var(--border)] text-[var(--stone)] hover:border-[var(--border-strong)] hover:text-[var(--ink-mid)]'
                      }`}
                    >
                      <Plus size={16} />
                      <span className="text-[0.58rem] tracking-wide uppercase font-medium">
                        New color
                      </span>
                    </button>
                  </div>
                )}

                {/* New colorway form */}
                {addingNewColor && (
                  <div className="mt-3 p-3 border border-[var(--border)] bg-[var(--bg-subtle)] space-y-2">
                    <p className="text-[0.62rem] tracking-[0.1em] uppercase text-[var(--stone)] font-medium mb-2">
                      Add New Colorway
                    </p>
                    <input
                      type="text"
                      value={newColorName}
                      onChange={e => setNewColorName(e.target.value)}
                      placeholder="Color name (e.g. Midnight Navy/White)"
                      className="input-luxury w-full"
                    />

                    {/* Image source switcher */}
                    <div className="flex items-center justify-between">
                      <span className="text-[0.6rem] tracking-[0.1em] uppercase text-[var(--stone)]">
                        Photo <span className="normal-case tracking-normal font-normal text-[var(--stone-light)]">— optional, shared with community</span>
                      </span>
                      <div className="flex border border-[var(--border)] text-[0.6rem] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => { setNewColorImageMode('url'); setNewColorImageFile(null); setNewColorImagePreview('') }}
                          className={`px-2.5 py-1 transition-colors ${newColorImageMode === 'url' ? 'bg-[var(--ink)] text-white' : 'text-[var(--stone)] hover:text-[var(--ink)]'}`}
                        >
                          URL
                        </button>
                        <button
                          type="button"
                          onClick={() => { setNewColorImageMode('file'); setNewColorImageUrl('') }}
                          className={`px-2.5 py-1 transition-colors ${newColorImageMode === 'file' ? 'bg-[var(--ink)] text-white' : 'text-[var(--stone)] hover:text-[var(--ink)]'}`}
                        >
                          Upload
                        </button>
                      </div>
                    </div>

                    {newColorImageMode === 'url' ? (
                      <>
                        <input
                          type="url"
                          value={newColorImageUrl}
                          onChange={e => setNewColorImageUrl(e.target.value)}
                          placeholder="https://example.com/shoe.jpg"
                          className="input-luxury w-full"
                        />
                        {newColorImageUrl.trim() && (
                          <div className="relative h-24 bg-white border border-[var(--border)] overflow-hidden">
                            <Image
                              src={newColorImageUrl.trim()}
                              alt="preview"
                              fill
                              className="object-contain p-1 mix-blend-multiply"
                              unoptimized
                              onError={() => setNewColorImageUrl('')}
                            />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {newColorImagePreview && (
                          <div className="relative h-24 bg-white border border-[var(--border)] overflow-hidden">
                            <Image
                              src={newColorImagePreview}
                              alt="preview"
                              fill
                              className="object-contain p-1 mix-blend-multiply"
                            />
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0]
                            if (!file) return
                            setNewColorImageFile(file)
                            setNewColorImagePreview(URL.createObjectURL(file))
                          }}
                          className="text-xs text-[var(--stone)] file:bg-[var(--bg-subtle)] file:border file:border-[var(--border)] file:text-[var(--ink)] file:text-[0.65rem] file:font-medium file:px-3 file:py-1.5 file:mr-3 file:cursor-pointer file:tracking-wide w-full"
                        />
                      </>
                    )}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setAddingNewColor(false)
                          setNewColorName('')
                          setNewColorImageUrl('')
                          setNewColorImageFile(null)
                          setNewColorImagePreview('')
                          setNewColorImageMode('url')
                        }}
                        className="btn-secondary text-xs py-1.5 px-3 flex-1 justify-center"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={addNewColorway}
                        disabled={!newColorName.trim() || savingColorway}
                        className="btn-primary text-xs py-1.5 px-3 flex-1 justify-center disabled:opacity-40"
                      >
                        {savingColorway ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <Check size={11} />
                        )}
                        Add &amp; Select
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Manual Entry Form ── */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                  Brand <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  required
                  className="input-luxury"
                  placeholder="Nike"
                />
              </div>
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                  Model <span className="text-[var(--danger)]">*</span>
                </label>
                <input
                  value={model}
                  onChange={e => setModel(e.target.value)}
                  required
                  className="input-luxury"
                  placeholder="Pegasus 41"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                  Nickname
                </label>
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  className="input-luxury"
                  placeholder="My daily driver"
                />
              </div>
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                  Size
                </label>
                <input
                  value={size}
                  onChange={e => setSize(e.target.value)}
                  className="input-luxury"
                  placeholder="270"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                  Color
                </label>
                <input
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  className="input-luxury"
                  placeholder="White/Black"
                />
              </div>
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                  Max Mileage (km)
                </label>
                <input
                  type="number"
                  value={maxMileage}
                  onChange={e => setMaxMileage(e.target.value)}
                  min="100"
                  max="2000"
                  className="input-luxury"
                />
              </div>
            </div>

            {/* Physical Specs */}
            <div>
              <p className="text-[0.62rem] tracking-[0.14em] uppercase text-[var(--stone)] font-medium border-b border-[var(--border)] pb-2 mb-3">
                Physical Specs
                <span className="ml-1.5 normal-case tracking-normal font-normal text-[var(--stone-light)]">
                  — optional, helps other users
                </span>
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                    Weight
                  </label>
                  <input
                    value={weight}
                    onChange={e => setWeight(e.target.value)}
                    className="input-luxury"
                    placeholder="280g"
                  />
                </div>
                <div>
                  <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                    Drop
                  </label>
                  <input
                    value={drop}
                    onChange={e => setDrop(e.target.value)}
                    className="input-luxury"
                    placeholder="10mm"
                  />
                </div>
                <div>
                  <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                    Stack
                  </label>
                  <input
                    value={stackHeight}
                    onChange={e => setStackHeight(e.target.value)}
                    className="input-luxury"
                    placeholder="36mm"
                  />
                </div>
              </div>
            </div>

            {/* Image — shown for manual entry or when user wants to override colorway image */}
            {!selected && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium">
                    Shoe Photo
                  </label>
                  <div className="flex border border-[var(--border)] text-[0.62rem] overflow-hidden">
                    <button
                      type="button"
                      onClick={() => {
                        setImageMode('file')
                        setImageUrl('')
                      }}
                      className={`px-3 py-1 transition-colors ${
                        imageMode === 'file'
                          ? 'bg-[var(--ink)] text-white'
                          : 'text-[var(--stone)] hover:text-[var(--ink)]'
                      }`}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageMode('url')
                        setImageFile(null)
                        setImagePreview('')
                      }}
                      className={`px-3 py-1 transition-colors ${
                        imageMode === 'url'
                          ? 'bg-[var(--ink)] text-white'
                          : 'text-[var(--stone)] hover:text-[var(--ink)]'
                      }`}
                    >
                      URL
                    </button>
                  </div>
                </div>

                {imageMode === 'file' ? (
                  <>
                    {imagePreview && (
                      <div className="relative h-32 bg-white border border-[var(--border)] overflow-hidden mb-2">
                        <Image
                          src={imagePreview}
                          alt="preview"
                          fill
                          className="object-contain p-2 mix-blend-multiply"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFile}
                      className="text-xs text-[var(--stone)] file:bg-[var(--bg-subtle)] file:border file:border-[var(--border)] file:text-[var(--ink)] file:text-[0.65rem] file:font-medium file:px-3 file:py-1.5 file:mr-3 file:cursor-pointer file:tracking-wide w-full"
                    />
                  </>
                ) : (
                  <>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={e => setImageUrl(e.target.value)}
                      className="input-luxury"
                      placeholder="https://example.com/shoe.jpg"
                    />
                    {imageUrl.trim() && (
                      <div className="relative h-32 bg-white border border-[var(--border)] overflow-hidden mt-2">
                        <Image
                          src={imageUrl.trim()}
                          alt="preview"
                          fill
                          className="object-contain p-2 mix-blend-multiply"
                          onError={() => setImageUrl('')}
                          unoptimized
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {error && (
              <p className="text-xs text-[var(--danger)] border border-[rgba(158,46,46,0.2)] bg-[rgba(158,46,46,0.04)] px-3.5 py-2.5">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary flex-1 justify-center py-2.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary flex-1 justify-center py-2.5"
              >
                {saving ? 'Adding...' : 'Add to Collection'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
