'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Shoe } from '@/lib/types'
import MileageBar from './MileageBar'
import { StarDisplay } from './StarRating'

interface RatingInfo { avg: number; count: number }

interface ShoeCardProps {
  shoe: Shoe
  onRetire?: () => void
  onReactivate?: () => void
  ratingInfo?: RatingInfo
}

export default function ShoeCard({ shoe, onRetire, onReactivate, ratingInfo }: ShoeCardProps) {
  const pct = Math.min((shoe.current_mileage / shoe.max_mileage) * 100, 100)

  const statusLabel =
    shoe.is_retired ? 'Retired' :
    pct >= 90 ? 'Replace Soon' :
    pct >= 70 ? 'Worn' :
    'Active'

  const statusColor =
    shoe.is_retired ? 'text-[var(--stone)]' :
    pct >= 90 ? 'text-[var(--danger)]' :
    pct >= 70 ? 'text-[var(--warn)]' :
    'text-[var(--safe)]'

  const hasAction = onRetire || onReactivate

  return (
    <Link href={`/shoes/${shoe.id}`}>
      <div className={`shoe-card luxury-card cursor-pointer overflow-hidden ${shoe.is_retired ? 'retired-overlay' : ''}`}>

        {/* Shoe image */}
        <div className="relative h-44 bg-white overflow-hidden">
          {shoe.image_url ? (
            <Image
              src={shoe.image_url}
              alt={`${shoe.brand} ${shoe.model}`}
              fill
              sizes="(max-width: 640px) 50vw, 33vw"
              className="object-contain p-2 mix-blend-multiply"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-5xl select-none opacity-8">👟</span>
            </div>
          )}

          <div className={`absolute top-2.5 right-2.5 text-[0.58rem] font-semibold tracking-[0.1em] uppercase ${statusColor}`}>
            {statusLabel}
          </div>
        </div>

        {/* Info */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="space-y-2.5">
            <div>
              <p className="text-[0.6rem] tracking-[0.14em] text-[var(--stone)] uppercase font-medium">{shoe.brand}</p>
              <p className="text-sm font-semibold text-[var(--ink)] truncate mt-0.5">
                {shoe.model}
              </p>
              {shoe.nickname && (
                <p className="text-[0.7rem] text-[var(--stone)] truncate">{shoe.nickname}</p>
              )}
            </div>

            <MileageBar current={shoe.current_mileage} max={shoe.max_mileage} />
          </div>

          {/* Rating + Retire/Reactivate row */}
          {(ratingInfo || hasAction) && (
            <div
              className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between"
              onPointerDown={e => e.stopPropagation()}
            >
              {/* Community rating badge */}
              {ratingInfo ? (
                <StarDisplay value={ratingInfo.avg} count={ratingInfo.count} size="xs" />
              ) : (
                <span />
              )}

              {/* Retire / Reactivate */}
              {!shoe.is_retired && onRetire && (
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); onRetire() }}
                  className="text-[0.6rem] tracking-[0.12em] uppercase font-medium text-[var(--stone-light)] hover:text-[var(--stone)] transition-colors py-0.5 px-1"
                >
                  Retire →
                </button>
              )}
              {shoe.is_retired && onReactivate && (
                <button
                  onClick={e => { e.preventDefault(); e.stopPropagation(); onReactivate() }}
                  className="text-[0.6rem] tracking-[0.12em] uppercase font-medium text-[var(--safe)] hover:opacity-70 transition-opacity py-0.5 px-1"
                >
                  ← Reactivate
                </button>
              )}
            </div>
          )}
        </div>

      </div>
    </Link>
  )
}
