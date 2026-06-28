interface MileageBarProps {
  current: number
  max: number
  className?: string
}

export default function MileageBar({ current, max, className = '' }: MileageBarProps) {
  const pct = Math.min((current / max) * 100, 100)
  const fillClass =
    pct >= 90 ? 'mileage-bar-fill-danger' :
    pct >= 70 ? 'mileage-bar-fill-warn' :
    'mileage-bar-fill-safe'

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex justify-between text-[0.68rem]">
        <span className="text-[var(--stone)]">{current.toFixed(0)} km</span>
        <span className="text-[var(--stone-light)]">/ {max} km</span>
      </div>
      <div className="mileage-bar-track h-[3px] rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${fillClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
