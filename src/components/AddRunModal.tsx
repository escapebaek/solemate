'use client'

import { useState } from 'react'
import { X, Upload, Loader2, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'

interface AddRunModalProps {
  shoeId: string
  onClose: () => void
  onAdded: () => void
}

export default function AddRunModal({ shoeId, onClose, onAdded }: AddRunModalProps) {
  const supabase = createClient()

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [distance, setDistance] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [aiResult, setAiResult] = useState<string | null>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setAiResult(null)
  }

  async function extractDistance() {
    if (!imageFile) return
    setExtracting(true)
    setError('')
    setAiResult(null)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1]
      try {
        const res = await fetch('/api/extract-distance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64, mimeType: imageFile.type }),
        })
        const data = await res.json()
        if (data.distance) {
          setDistance(String(data.distance))
          if (data.date) setDate(data.date)
          setAiResult(`${data.distance} km${data.date ? ` · ${data.date}` : ''} detected`)
        } else {
          setError(data.error || 'Could not detect distance. Please enter manually.')
        }
      } catch {
        setError('AI extraction failed. Please enter distance manually.')
      } finally {
        setExtracting(false)
      }
    }
    reader.readAsDataURL(imageFile)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!distance || parseFloat(distance) <= 0) {
      setError('Please enter a valid distance')
      return
    }
    setSaving(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }

    let screenshotUrl: string | null = null
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage
        .from('run-screenshots')
        .upload(path, imageFile)
      if (!uploadErr) {
        const { data } = supabase.storage.from('run-screenshots').getPublicUrl(path)
        screenshotUrl = data.publicUrl
      }
    }

    const km = parseFloat(distance)

    const { error: runErr } = await supabase.from('runs').insert({
      user_id: user.id,
      shoe_id: shoeId,
      distance: km,
      date,
      screenshot_url: screenshotUrl,
      notes: notes || null,
    })

    if (runErr) {
      setError(runErr.message)
      setSaving(false)
      return
    }

    const { data: shoe } = await supabase
      .from('shoes')
      .select('current_mileage')
      .eq('id', shoeId)
      .single()

    if (shoe) {
      await fetch('/api/shoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shoeId, current_mileage: (shoe.current_mileage || 0) + km }),
      })
    }

    onAdded()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 modal-backdrop" onClick={onClose}>
      <div
        className="luxury-card relative w-full sm:max-w-md max-h-[92vh] sm:max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-none"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[var(--border)]">
          <h2 className="text-xs font-semibold tracking-[0.18em] uppercase text-[var(--ink)]">
            Log Run
          </h2>
          <button onClick={onClose} className="text-[var(--stone-light)] hover:text-[var(--ink)] transition-colors">
            <X size={17} />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Screenshot upload */}
          <div>
            <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-2">
              Running App Screenshot
            </label>

            <label className="block border border-dashed border-[var(--border)] hover:border-[var(--border-strong)] transition-colors cursor-pointer bg-[var(--bg-subtle)]">
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
              {imagePreview ? (
                <div className="relative h-44">
                  <Image src={imagePreview} alt="screenshot" fill className="object-contain p-2" />
                </div>
              ) : (
                <div className="h-28 flex flex-col items-center justify-center gap-2 text-[var(--stone-light)]">
                  <Upload size={20} />
                  <span className="text-[0.68rem] tracking-wide">Upload screenshot</span>
                  <span className="text-[0.62rem] text-[var(--stone-light)]">Garmin · Nike Run Club · Strava</span>
                </div>
              )}
            </label>

            {imageFile && (
              <button
                type="button"
                onClick={extractDistance}
                disabled={extracting}
                className="btn-secondary w-full justify-center mt-2 py-2"
              >
                {extracting ? (
                  <><Loader2 size={13} className="animate-spin" /> Analyzing...</>
                ) : (
                  <><Sparkles size={13} /> Extract Distance with AI</>
                )}
              </button>
            )}

            {aiResult && (
              <p className="mt-2 text-[0.7rem] text-[var(--safe)] border border-[rgba(43,102,74,0.25)] bg-[rgba(43,102,74,0.04)] px-3.5 py-2">
                ✓ {aiResult}
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                  Distance (km) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={distance}
                  onChange={e => setDistance(e.target.value)}
                  required
                  className="input-luxury"
                  placeholder="10.5"
                />
              </div>
              <div>
                <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  required
                  className="input-luxury"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.62rem] tracking-[0.12em] uppercase text-[var(--stone)] font-medium mb-1.5">
                Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="input-luxury"
                placeholder="Easy recovery run..."
              />
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
                {saving ? 'Saving...' : 'Log Run'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
