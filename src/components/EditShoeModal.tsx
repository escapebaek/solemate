'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Shoe } from '@/lib/types'

interface EditShoeModalProps {
  shoe: Shoe
  onClose: () => void
  onSaved: (updated: Shoe) => void
}

export default function EditShoeModal({ shoe, onClose, onSaved }: EditShoeModalProps) {
  const supabase = createClient()

  const [brand, setBrand] = useState(shoe.brand)
  const [model, setModel] = useState(shoe.model)
  const [nickname, setNickname] = useState(shoe.nickname ?? '')
  const [color, setColor] = useState(shoe.color ?? '')
  const [size, setSize] = useState(shoe.size ?? '')
  const [maxMileage, setMaxMileage] = useState(String(shoe.max_mileage))
  const [notes, setNotes] = useState(shoe.notes ?? '')
  const [purchaseDate, setPurchaseDate] = useState(shoe.purchase_date ?? '')

  // Specs
  const [weight, setWeight] = useState(shoe.specs?.weight ?? '')
  const [drop, setDrop] = useState(shoe.specs?.drop ?? '')
  const [stackHeight, setStackHeight] = useState(shoe.specs?.stack_height ?? '')
  const [msrp, setMsrp] = useState(shoe.specs?.msrp != null ? String(shoe.specs.msrp) : '')
  const [purchasePrice, setPurchasePrice] = useState(shoe.specs?.purchase_price != null ? String(shoe.specs.purchase_price) : '')
  const [purchaseCurrency, setPurchaseCurrency] = useState(shoe.specs?.purchase_currency ?? 'KRW')

  // Image
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(shoe.image_url ?? '')
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [imageMode, setImageMode] = useState<'file' | 'url'>('file')
  const [removeImage, setRemoveImage] = useState(false)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setRemoveImage(false)
    setImagePreview(URL.createObjectURL(file))
  }

  function handleRemoveImage() {
    setRemoveImage(true)
    setImageFile(null)
    setImagePreview('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!brand || !model) {
      setError('Brand and model are required')
      return
    }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    let imageUrl: string | null = shoe.image_url ?? null

    if (removeImage) {
      imageUrl = null
    } else if (imageMode === 'url' && imageUrlInput.trim()) {
      imageUrl = imageUrlInput.trim()
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
      imageUrl = urlData.publicUrl
    }

    const updatedSpecs = {
      ...shoe.specs,
      weight: weight || undefined,
      drop: drop || undefined,
      stack_height: stackHeight || undefined,
      msrp: msrp ? parseFloat(msrp) : undefined,
      purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
      purchase_currency: purchasePrice ? purchaseCurrency : undefined,
    }
    const hasSpecs = Object.values(updatedSpecs).some(v => v !== undefined)

    const payload = {
      brand,
      model,
      nickname: nickname || null,
      color: color || null,
      size: size || null,
      max_mileage: parseFloat(maxMileage) || shoe.max_mileage,
      notes: notes || null,
      purchase_date: purchaseDate || null,
      image_url: imageUrl,
      specs: hasSpecs ? updatedSpecs : null,
    }

    const res = await fetch('/api/shoes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: shoe.id, ...payload }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error || 'Update failed')
      setSaving(false)
    } else {
      const updated: Shoe = {
        ...shoe,
        brand,
        model,
        nickname: nickname || undefined,
        color: color || undefined,
        size: size || undefined,
        max_mileage: parseFloat(maxMileage) || shoe.max_mileage,
        notes: notes || undefined,
        purchase_date: purchaseDate || undefined,
        image_url: imageUrl || undefined,
        specs: hasSpecs ? updatedSpecs : undefined,
      }
      onSaved(updated)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 modal-backdrop" onClick={onClose}>
      <div
        className="luxury-card relative w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[var(--border)]">
          <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ink)]">
            Edit Shoe
          </h2>
          <button onClick={onClose} className="text-[var(--stone-light)] hover:text-[var(--ink)] transition-colors">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">

          {/* ── Photo ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium">
                Shoe Photo
              </label>
              <div className="flex border border-[var(--border)] text-[0.62rem] overflow-hidden">
                <button
                  type="button"
                  onClick={() => { setImageMode('file'); setImageUrlInput('') }}
                  className={`px-3 py-1 transition-colors ${imageMode === 'file' ? 'bg-[var(--ink)] text-white' : 'text-[var(--stone)] hover:text-[var(--ink)]'}`}
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => { setImageMode('url'); setImageFile(null) }}
                  className={`px-3 py-1 transition-colors ${imageMode === 'url' ? 'bg-[var(--ink)] text-white' : 'text-[var(--stone)] hover:text-[var(--ink)]'}`}
                >
                  URL
                </button>
              </div>
            </div>

            {/* Current image preview */}
            {imagePreview && imageMode === 'file' && (
              <div className="relative h-40 bg-white border border-[var(--border)] overflow-hidden mb-2">
                <Image src={imagePreview} alt="preview" fill className="object-contain p-2 mix-blend-multiply" />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-white border border-[var(--border)] text-[var(--stone)] hover:text-[var(--danger)] p-1 transition-colors"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            {imageMode === 'file' ? (
              <>
                {!imagePreview && (
                  <div className="h-20 bg-[var(--bg-subtle)] border border-dashed border-[var(--border)] flex items-center justify-center mb-2">
                    <span className="text-[0.7rem] text-[var(--stone-light)]">No photo</span>
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
                  value={imageUrlInput}
                  onChange={e => setImageUrlInput(e.target.value)}
                  className="input-luxury"
                  placeholder="https://example.com/shoe.jpg"
                />
                {imageUrlInput.trim() && (
                  <div className="relative h-40 bg-white border border-[var(--border)] overflow-hidden mt-2">
                    <Image
                      src={imageUrlInput.trim()}
                      alt="preview"
                      fill
                      className="object-contain p-2 mix-blend-multiply"
                      onError={() => setImageUrlInput('')}
                      unoptimized
                    />
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── Basic Info ── */}
          <div className="space-y-4">
            <p className="text-[0.62rem] tracking-[0.14em] uppercase text-[var(--stone)] font-medium border-b border-[var(--border)] pb-2">
              Basic Info
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                  Brand <span className="text-[var(--danger)]">*</span>
                </label>
                <input value={brand} onChange={e => setBrand(e.target.value)} required className="input-luxury" placeholder="Nike" />
              </div>
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                  Model <span className="text-[var(--danger)]">*</span>
                </label>
                <input value={model} onChange={e => setModel(e.target.value)} required className="input-luxury" placeholder="Pegasus 41" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">Nickname</label>
                <input value={nickname} onChange={e => setNickname(e.target.value)} className="input-luxury" placeholder="My daily driver" />
              </div>
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">Size</label>
                <input value={size} onChange={e => setSize(e.target.value)} className="input-luxury" placeholder="270" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">Color</label>
                <input value={color} onChange={e => setColor(e.target.value)} className="input-luxury" placeholder="White/Black" />
              </div>
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">Purchase Date</label>
                <input type="date" value={purchaseDate} onChange={e => setPurchaseDate(e.target.value)} className="input-luxury" />
              </div>
            </div>

            <div>
              <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">Notes</label>
              <input value={notes} onChange={e => setNotes(e.target.value)} className="input-luxury" placeholder="Race day only..." />
            </div>
          </div>

          {/* ── Mileage ── */}
          <div className="space-y-3">
            <p className="text-[0.62rem] tracking-[0.14em] uppercase text-[var(--stone)] font-medium border-b border-[var(--border)] pb-2">
              Mileage
            </p>
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
              <p className="text-[0.65rem] text-[var(--stone)] mt-1">
                Current: {shoe.current_mileage.toFixed(0)} km logged
              </p>
            </div>
          </div>

          {/* ── Specs ── */}
          <div className="space-y-3">
            <p className="text-[0.62rem] tracking-[0.14em] uppercase text-[var(--stone)] font-medium border-b border-[var(--border)] pb-2">
              Specifications
            </p>

            {/* Purchase Price */}
            <div>
              <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                Purchase Price
              </label>
              <div className="flex border border-[var(--border)] focus-within:border-[var(--ink)] transition-colors">
                <select
                  value={purchaseCurrency}
                  onChange={e => setPurchaseCurrency(e.target.value)}
                  className="text-[0.72rem] font-medium text-[var(--stone)] bg-[var(--bg-subtle)] border-r border-[var(--border)] px-2 py-2.5 outline-none cursor-pointer hover:text-[var(--ink)] transition-colors"
                >
                  <option value="KRW">KRW</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="JPY">JPY</option>
                  <option value="GBP">GBP</option>
                  <option value="CNY">CNY</option>
                </select>
                <input
                  type="number"
                  value={purchasePrice}
                  onChange={e => setPurchasePrice(e.target.value)}
                  min="0"
                  className="flex-1 px-3 py-2.5 text-sm text-[var(--ink)] bg-white outline-none placeholder:text-[var(--stone-light)]"
                  placeholder={purchaseCurrency === 'KRW' ? '150000' : '130'}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                  Retail Price ($)
                </label>
                <input
                  type="number"
                  value={msrp}
                  onChange={e => setMsrp(e.target.value)}
                  min="0"
                  className="input-luxury"
                  placeholder="130"
                />
              </div>
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">Weight</label>
                <input value={weight} onChange={e => setWeight(e.target.value)} className="input-luxury" placeholder="280g" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">Heel-Toe Drop</label>
                <input value={drop} onChange={e => setDrop(e.target.value)} className="input-luxury" placeholder="10mm" />
              </div>
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">Stack Height</label>
                <input value={stackHeight} onChange={e => setStackHeight(e.target.value)} className="input-luxury" placeholder="36mm" />
              </div>
            </div>
          </div>

          {error && (
            <p className="text-xs text-[var(--danger)] border border-[rgba(158,46,46,0.2)] bg-[rgba(158,46,46,0.04)] px-3.5 py-2.5">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-2.5">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center py-2.5">
              {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
