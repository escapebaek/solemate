'use client'

import { useState } from 'react'

const GOLD = '#C9A96E'
const EMPTY = '#DDD8D0'

type Fill = 'full' | 'half' | 'empty'

function StarChar({ fill, sizePx }: { fill: Fill; sizePx: number }) {
  const base: React.CSSProperties = { fontSize: sizePx, lineHeight: 1, userSelect: 'none', display: 'inline-block' }

  if (fill === 'full') return <span style={{ ...base, color: GOLD }}>★</span>
  if (fill === 'empty') return <span style={{ ...base, color: EMPTY }}>★</span>

  // Half star: absolute overlay of the left half in gold
  return (
    <span style={{ ...base, position: 'relative', color: EMPTY }}>
      ★
      <span style={{ position: 'absolute', left: 0, top: 0, width: '52%', overflow: 'hidden', color: GOLD }}>
        ★
      </span>
    </span>
  )
}

function getFill(starIdx: number, value: number): Fill {
  if (value >= starIdx + 1) return 'full'
  if (value >= starIdx + 0.5) return 'half'
  return 'empty'
}

// ── Static display ────────────────────────────────────────────────────────

interface DisplayProps {
  value: number          // 0 – 5
  count?: number
  size?: 'xs' | 'sm' | 'md'
  showNum?: boolean
}

export function StarDisplay({ value, count, size = 'sm', showNum = true }: DisplayProps) {
  const px = { xs: 11, sm: 14, md: 20 }[size]
  const numCls = { xs: 'text-[0.6rem]', sm: 'text-[0.68rem]', md: 'text-xs' }[size]

  return (
    <div className="flex items-center" style={{ gap: 3 }}>
      <span className="flex" style={{ gap: 1 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <StarChar key={i} fill={getFill(i, value)} sizePx={px} />
        ))}
      </span>
      {showNum && (
        <span className={`${numCls} text-[var(--stone)] tabular-nums`}>
          {value.toFixed(1)}
          {count !== undefined && (
            <span className="text-[var(--stone-light)]"> ({count})</span>
          )}
        </span>
      )}
    </div>
  )
}

// ── Interactive input ─────────────────────────────────────────────────────

interface InputProps {
  value: number | null     // null = not yet rated
  onRate: (v: number | null) => void   // null = remove
  size?: 'sm' | 'md' | 'lg'
}

export function StarInput({ value, onRate, size = 'md' }: InputProps) {
  const [hover, setHover] = useState<number | null>(null)
  const px = { sm: 22, md: 30, lg: 40 }[size]
  const display = hover ?? value ?? 0

  function handleClick(v: number) {
    // Clicking the same value removes the rating
    onRate(v === value ? null : v)
  }

  return (
    <div className="flex" style={{ gap: 4 }} onMouseLeave={() => setHover(null)}>
      {[0, 1, 2, 3, 4].map(i => (
        <span key={i} style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
          <StarChar fill={getFill(i, display)} sizePx={px} />
          {/* Left half → half-star */}
          <span
            style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%' }}
            onMouseEnter={() => setHover(i + 0.5)}
            onClick={() => handleClick(i + 0.5)}
          />
          {/* Right half → full star */}
          <span
            style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%' }}
            onMouseEnter={() => setHover(i + 1)}
            onClick={() => handleClick(i + 1)}
          />
        </span>
      ))}
    </div>
  )
}
