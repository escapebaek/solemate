'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Shoe } from '@/lib/types'
import ShoeCard from './ShoeCard'

interface RatingInfo { avg: number; count: number }

interface Props {
  shoe: Shoe
  onRetire?: () => void
  ratingInfo?: RatingInfo
}

export default function SortableShoeCard({ shoe, onRetire, ratingInfo }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: shoe.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.4 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="touch-none select-none"
    >
      <ShoeCard shoe={shoe} onRetire={onRetire} ratingInfo={ratingInfo} />
    </div>
  )
}
