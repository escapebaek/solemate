'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, X } from 'lucide-react'
import { Shoe } from '@/lib/types'

interface Props {
  shoes: Shoe[]
  onClose: () => void
}

const PALETTE = [
  '#1C1C1E',
  '#8B7355',
  '#2B4C7E',
  '#4A7C59',
  '#7B4F6B',
  '#C05621',
  '#5B7B7A',
  '#6B5B45',
  '#4A5568',
  '#9B6B3A',
  '#3D6B8A',
  '#6B7B4A',
]

export default function SummaryModal({ shoes, onClose }: Props) {
  const canvasRef1 = useRef<HTMLCanvasElement>(null)
  const canvasRef2 = useRef<HTMLCanvasElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeView, setActiveView] = useState(0)

  useEffect(() => {
    if (canvasRef1.current) drawDonut(canvasRef1.current, shoes)
    if (canvasRef2.current) drawTreemap(canvasRef2.current, shoes)
  }, [shoes])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const onScroll = () => setActiveView(Math.round(el.scrollLeft / el.clientWidth))
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

  function goTo(v: number) {
    scrollRef.current?.scrollTo({ left: v * (scrollRef.current.clientWidth), behavior: 'smooth' })
  }

  function download() {
    const canvas = activeView === 0 ? canvasRef1.current : canvasRef2.current
    if (!canvas) return
    const a = document.createElement('a')
    a.download = `solemate-${activeView === 0 ? 'summary' : 'heatmap'}-${new Date().toISOString().slice(0, 10)}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 modal-backdrop"
      onClick={onClose}
    >
      <div
        className="relative bg-white w-full max-w-[320px] flex flex-col shadow-2xl"
        style={{ maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
          <div className="flex items-center gap-3">
            <p className="text-[0.6rem] tracking-[0.2em] uppercase text-[var(--stone)] font-medium">
              Running Summary
            </p>
            <span className="text-[0.58rem] text-[var(--stone-light)]">
              {activeView === 0 ? 'Donut' : 'Heatmap'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--stone-light)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Swipeable canvas slides */}
        <div
          ref={scrollRef}
          className="flex shrink-0"
          style={{
            overflow: 'hidden scroll',
            scrollSnapType: 'x mandatory',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            flex: 1,
            minHeight: 0,
          } as React.CSSProperties}
        >
          {([canvasRef1, canvasRef2] as const).map((ref, i) => (
            <div
              key={i}
              style={{
                flexShrink: 0,
                width: '100%',
                scrollSnapAlign: 'start',
                overflowY: 'auto',
                padding: '0 12px 12px',
              }}
            >
              <canvas ref={ref} style={{ width: '100%', display: 'block' }} />
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 pt-2.5 pb-4 border-t border-[var(--border)] flex flex-col gap-2.5">
          {/* Slide indicators + swipe hint */}
          <div className="flex items-center justify-center gap-3">
            {[0, 1].map(v => (
              <button
                key={v}
                onClick={() => goTo(v)}
                className={`transition-all rounded-full ${
                  activeView === v
                    ? 'w-5 h-1.5 bg-[var(--ink)]'
                    : 'w-1.5 h-1.5 bg-[var(--border-strong)]'
                }`}
              />
            ))}
            <span className="text-[0.58rem] text-[var(--stone-light)] ml-1">swipe ←→</span>
          </div>
          <button onClick={download} className="btn-primary w-full justify-center py-2.5">
            <Download size={13} />
            {activeView === 0 ? 'Download Summary' : 'Download Heatmap'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared helpers ────────────────────────────────────────────────────────

function setLS(ctx: CanvasRenderingContext2D, v: string) {
  try { (ctx as unknown as Record<string, string>).letterSpacing = v } catch {}
}

function truncate(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text
  let t = text
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1)
  return t + '…'
}

function shoeLabel(shoe: Shoe) {
  return `${shoe.brand} ${shoe.model}`
}

// ─── View 1 : Donut chart ─────────────────────────────────────────────────

function drawDonut(canvas: HTMLCanvasElement, shoes: Shoe[]) {
  const W = 1080
  const PAD = 72
  const CX = W / 2
  const FF = "system-ui, -apple-system, 'Segoe UI', sans-serif"
  const total = shoes.reduce((s, sh) => s + sh.current_mileage, 0)
  const nonZero = shoes.filter(s => s.current_mileage > 0)

  const ROW_H = Math.max(72, Math.min(108, 800 / Math.max(shoes.length, 1)))
  const H = Math.max(1920, 1060 + shoes.length * ROW_H + 180)

  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')!

  ctx.fillStyle = '#F8F6F3'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(30, 30, W - 60, H - 60)
  ctx.strokeStyle = '#DDD8D0'
  ctx.lineWidth = 2
  ctx.strokeRect(30, 30, W - 60, H - 60)

  // Header
  ctx.textAlign = 'center'
  ctx.font = `800 78px ${FF}`
  ctx.fillStyle = '#1C1C1E'
  setLS(ctx, '0.36em')
  ctx.fillText('SOLEMATE', CX + 14, 148)
  setLS(ctx, '0px')
  ctx.font = `400 22px ${FF}`
  ctx.fillStyle = '#AEAEB2'
  setLS(ctx, '0.26em')
  ctx.fillText('RUNNING SUMMARY', CX + 5, 192)
  setLS(ctx, '0px')
  ctx.font = `300 19px ${FF}`
  ctx.fillStyle = '#C7C7CC'
  ctx.fillText(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), CX, 228)
  ctx.strokeStyle = '#E8E3DC'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, 258); ctx.lineTo(W - PAD, 258); ctx.stroke()

  // Donut
  const CY = 656; const R = 310; const HOLE = 200; const GAP = 0.022
  if (nonZero.length > 0) {
    let angle = -Math.PI / 2
    nonZero.forEach((shoe, i) => {
      const sweep = (shoe.current_mileage / total) * Math.PI * 2 - GAP
      ctx.beginPath(); ctx.moveTo(CX, CY)
      ctx.arc(CX, CY, R, angle + GAP / 2, angle + Math.max(sweep, 0.002) + GAP / 2)
      ctx.closePath()
      ctx.fillStyle = PALETTE[i % PALETTE.length]; ctx.fill()
      angle += sweep + GAP
    })
  } else {
    ctx.beginPath(); ctx.arc(CX, CY, R, 0, Math.PI * 2)
    ctx.fillStyle = '#F2F2F7'; ctx.fill()
  }
  ctx.beginPath(); ctx.arc(CX, CY, HOLE, 0, Math.PI * 2)
  ctx.fillStyle = '#FFFFFF'; ctx.fill()

  ctx.textAlign = 'center'
  ctx.font = `800 104px ${FF}`; ctx.fillStyle = '#1C1C1E'
  ctx.fillText(String(Math.round(total)), CX, CY + 36)
  ctx.font = `500 22px ${FF}`; ctx.fillStyle = '#8E8E93'
  setLS(ctx, '0.2em'); ctx.fillText('KM TOTAL', CX + 4, CY + 82); setLS(ctx, '0px')
  ctx.font = `300 19px ${FF}`; ctx.fillStyle = '#C7C7CC'
  ctx.fillText(`${shoes.length} shoe${shoes.length !== 1 ? 's' : ''}`, CX, CY + 113)

  const divY = CY + R + 55
  ctx.strokeStyle = '#E8E3DC'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, divY); ctx.lineTo(W - PAD, divY); ctx.stroke()
  ctx.textAlign = 'left'; ctx.font = `400 17px ${FF}`; ctx.fillStyle = '#AEAEB2'
  setLS(ctx, '0.18em'); ctx.fillText('COLLECTION', PAD, divY + 38); setLS(ctx, '0px')

  // Shoe list
  const LIST_TOP = 1060
  const BAR_X = 460; const BAR_W = 396; const KM_X = W - PAD

  shoes.forEach((shoe, i) => {
    const ry = LIST_TOP + i * ROW_H; const mid = ry + ROW_H / 2
    const color = PALETTE[i % PALETTE.length]
    const km = shoe.current_mileage
    const pct = total > 0 ? (km / total) * 100 : 0
    const dimA = shoe.is_retired ? 0.4 : 1.0

    ctx.globalAlpha = dimA; ctx.fillStyle = color
    ctx.fillRect(PAD, ry + 14, 5, ROW_H - 28)

    const hasSub = !!shoe.nickname
    ctx.font = `600 27px ${FF}`; ctx.fillStyle = '#1C1C1E'; ctx.textAlign = 'left'
    ctx.fillText(truncate(ctx, shoeLabel(shoe), 340), 97, hasSub ? mid - 10 : mid + 9)
    ctx.font = `400 19px ${FF}`; ctx.fillStyle = '#8E8E93'
    if (hasSub) ctx.fillText(truncate(ctx, shoe.nickname!, 340), 97, mid + 16)
    else ctx.fillText(`${pct.toFixed(1)}%`, 97, mid + 33)

    ctx.globalAlpha = 0.12; ctx.fillStyle = color
    ctx.beginPath(); ctx.roundRect(BAR_X, mid - 4, BAR_W, 8, 4); ctx.fill()
    ctx.globalAlpha = dimA; ctx.fillStyle = color
    if (km > 0 && total > 0) {
      ctx.beginPath(); ctx.roundRect(BAR_X, mid - 4, (km / total) * BAR_W, 8, 4); ctx.fill()
    }
    ctx.font = `700 27px ${FF}`; ctx.fillStyle = '#1C1C1E'; ctx.textAlign = 'right'
    ctx.fillText(`${Math.round(km)} km`, KM_X, mid + 9)
    ctx.globalAlpha = 1.0

    if (i < shoes.length - 1) {
      ctx.strokeStyle = '#F2F2F7'; ctx.lineWidth = 1
      ctx.beginPath(); ctx.moveTo(PAD + 14, ry + ROW_H); ctx.lineTo(W - PAD, ry + ROW_H); ctx.stroke()
    }
  })

  // Footer
  const footY = H - 55
  ctx.strokeStyle = '#E8E3DC'; ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, footY - 22); ctx.lineTo(W - PAD, footY - 22); ctx.stroke()
  ctx.textAlign = 'center'; ctx.font = `300 17px ${FF}`; ctx.fillStyle = '#D1D1D6'
  setLS(ctx, '0.28em'); ctx.fillText('SOLEMATE', CX + 4, footY); setLS(ctx, '0px')
}

// ─── View 2 : Treemap heatmap ─────────────────────────────────────────────

interface TRect { x: number; y: number; w: number; h: number }

function treemapLayout(values: number[], rect: TRect, gap: number): TRect[] {
  if (values.length === 0) return []
  if (values.length === 1) return [{ ...rect }]

  const total = values.reduce((s, v) => s + v, 0)

  // Find the binary split that minimises the worst sub-rectangle aspect ratio
  let bestSplit = 1; let bestScore = Infinity
  for (let k = 1; k < values.length; k++) {
    const lSum = values.slice(0, k).reduce((s, v) => s + v, 0)
    const rSum = total - lSum
    const lf = lSum / total; const rf = rSum / total
    let lAR: number; let rAR: number
    if (rect.w >= rect.h) {
      const lw = rect.w * lf; const rw = rect.w * rf
      lAR = Math.max(rect.h / lw, lw / rect.h)
      rAR = Math.max(rect.h / rw, rw / rect.h)
    } else {
      const lh = rect.h * lf; const rh = rect.h * rf
      lAR = Math.max(lh / rect.w, rect.w / lh)
      rAR = Math.max(rh / rect.w, rect.w / rh)
    }
    const score = Math.max(lAR, rAR)
    if (score < bestScore) { bestScore = score; bestSplit = k }
  }

  const leftVals = values.slice(0, bestSplit)
  const rightVals = values.slice(bestSplit)
  const lf = leftVals.reduce((s, v) => s + v, 0) / total

  let lr: TRect; let rr: TRect
  if (rect.w >= rect.h) {
    const lw = rect.w * lf - gap / 2
    lr = { x: rect.x, y: rect.y, w: lw, h: rect.h }
    rr = { x: rect.x + lw + gap, y: rect.y, w: rect.w - lw - gap, h: rect.h }
  } else {
    const lh = rect.h * lf - gap / 2
    lr = { x: rect.x, y: rect.y, w: rect.w, h: lh }
    rr = { x: rect.x, y: rect.y + lh + gap, w: rect.w, h: rect.h - lh - gap }
  }

  return [...treemapLayout(leftVals, lr, gap), ...treemapLayout(rightVals, rr, gap)]
}

function drawTreemap(canvas: HTMLCanvasElement, shoes: Shoe[]) {
  const W = 1080
  const H = 1920
  const FF = "system-ui, -apple-system, 'Segoe UI', sans-serif"
  const HEADER_H = 200
  const FOOTER_H = 90
  const OUTER_PAD = 16
  const GAP = 10
  const total = shoes.reduce((s, sh) => s + sh.current_mileage, 0)

  canvas.width = W
  canvas.height = H

  const ctx = canvas.getContext('2d')!

  // Dark background
  ctx.fillStyle = '#111111'
  ctx.fillRect(0, 0, W, H)

  // Subtle grid texture
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let x = 0; x < W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke() }
  for (let y = 0; y < H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke() }

  // ── Header ──
  const CX = W / 2
  ctx.textAlign = 'center'
  ctx.font = `800 76px ${FF}`
  ctx.fillStyle = '#FFFFFF'
  setLS(ctx, '0.36em')
  ctx.fillText('SOLEMATE', CX + 14, 100)
  setLS(ctx, '0px')

  ctx.font = `400 22px ${FF}`
  ctx.fillStyle = 'rgba(255,255,255,0.4)'
  setLS(ctx, '0.22em')
  ctx.fillText('SHOE MILEAGE HEATMAP', CX + 5, 146)
  setLS(ctx, '0px')

  ctx.font = `300 18px ${FF}`
  ctx.fillStyle = 'rgba(255,255,255,0.25)'
  ctx.fillText(new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), CX, 182)

  // ── Treemap tiles ──
  const tmX = OUTER_PAD
  const tmY = HEADER_H
  const tmW = W - OUTER_PAD * 2
  const tmH = H - HEADER_H - FOOTER_H

  // Sort by mileage descending; ensure a minimum display value for 0-km shoes
  const sorted = [...shoes].sort((a, b) => b.current_mileage - a.current_mileage)
  const displayVals = sorted.map(s => Math.max(s.current_mileage, total * 0.01 || 1))
  const rects = treemapLayout(displayVals, { x: tmX, y: tmY, w: tmW, h: tmH }, GAP)

  sorted.forEach((shoe, i) => {
    const r = rects[i]
    if (!r || r.w < 2 || r.h < 2) return
    const color = PALETTE[i % PALETTE.length]
    const km = shoe.current_mileage
    const pct = total > 0 ? (km / total) * 100 : 0

    // Tile fill
    ctx.fillStyle = color
    ctx.globalAlpha = shoe.is_retired ? 0.45 : 1
    ctx.beginPath()
    ctx.roundRect(r.x, r.y, r.w, r.h, 4)
    ctx.fill()
    ctx.globalAlpha = 1

    // Subtle inner shadow (top edge highlight)
    const grad = ctx.createLinearGradient(r.x, r.y, r.x, r.y + Math.min(r.h, 80))
    grad.addColorStop(0, 'rgba(255,255,255,0.12)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.roundRect(r.x, r.y, r.w, r.h, 4)
    ctx.fill()

    // Text sizing based on tile dimensions
    const minSide = Math.min(r.w, r.h)
    const cx = r.x + r.w / 2
    const cy = r.y + r.h / 2

    ctx.fillStyle = 'rgba(255,255,255,0.95)'
    ctx.textAlign = 'center'
    ctx.shadowColor = 'rgba(0,0,0,0.4)'
    ctx.shadowBlur = 6

    if (minSide >= 180) {
      // Large tile: name + km + %
      const label = `${shoe.brand} ${shoe.model}`
      const nickname = shoe.nickname || ''
      const nameFontSize = Math.max(28, Math.min(62, minSide / 4))
      ctx.font = `700 ${nameFontSize}px ${FF}`
      const nameW = r.w - 24
      ctx.fillText(truncate(ctx, label, nameW), cx, cy - nameFontSize * 0.55)
      if (nickname) {
        ctx.font = `400 ${nameFontSize * 0.5}px ${FF}`
        ctx.fillStyle = 'rgba(255,255,255,0.6)'
        ctx.fillText(truncate(ctx, nickname, nameW), cx, cy - nameFontSize * 0.55 + nameFontSize * 0.65)
        ctx.fillStyle = 'rgba(255,255,255,0.95)'
      }
      ctx.font = `800 ${nameFontSize * 0.85}px ${FF}`
      ctx.fillText(`${Math.round(km)} km`, cx, cy + nameFontSize * 0.85)
      ctx.font = `400 ${nameFontSize * 0.48}px ${FF}`
      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.fillText(`${pct.toFixed(1)}%`, cx, cy + nameFontSize * 0.85 + nameFontSize * 0.6)
    } else if (minSide >= 90) {
      // Medium tile: name + km
      const label = shoe.model
      const fs = Math.max(18, Math.min(34, minSide / 4.5))
      ctx.font = `700 ${fs}px ${FF}`
      ctx.fillText(truncate(ctx, label, r.w - 16), cx, cy - fs * 0.35)
      ctx.font = `600 ${fs * 0.82}px ${FF}`
      ctx.fillStyle = 'rgba(255,255,255,0.8)'
      ctx.fillText(`${Math.round(km)} km`, cx, cy + fs * 0.75)
    } else if (minSide >= 50) {
      // Small tile: just model name
      const label = shoe.model
      const fs = Math.max(13, Math.min(22, minSide / 3.5))
      ctx.font = `600 ${fs}px ${FF}`
      ctx.fillText(truncate(ctx, label, r.w - 10), cx, cy + fs * 0.36)
    } else if (minSide >= 28) {
      // Tiny: abbreviation
      const abbr = shoe.model.slice(0, 3).toUpperCase()
      ctx.font = `600 ${Math.max(11, minSide * 0.28)}px ${FF}`
      ctx.fillText(abbr, cx, cy + 4)
    }

    ctx.shadowBlur = 0
  })

  // ── Total summary bar at footer ──
  const barY = H - FOOTER_H + 14
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(OUTER_PAD, barY - 4); ctx.lineTo(W - OUTER_PAD, barY - 4); ctx.stroke()

  ctx.textAlign = 'left'
  ctx.font = `700 28px ${FF}`
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.fillText(`${Math.round(total)} km`, OUTER_PAD + 4, barY + 30)

  ctx.font = `400 20px ${FF}`
  ctx.fillStyle = 'rgba(255,255,255,0.35)'
  ctx.fillText(`across ${shoes.length} shoe${shoes.length !== 1 ? 's' : ''}`, OUTER_PAD + 4, barY + 58)

  ctx.textAlign = 'right'
  ctx.font = `300 16px ${FF}`
  ctx.fillStyle = 'rgba(255,255,255,0.2)'
  setLS(ctx, '0.22em')
  ctx.fillText('SOLEMATE', W - OUTER_PAD - 4, barY + 46)
  setLS(ctx, '0px')
}
