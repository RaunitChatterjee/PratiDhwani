import { memo } from 'react'
import { useCountUp } from '../hooks/useCountUp'

const SIZE = 120
const STROKE = 10
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const LEVEL_COLOR = {
  positive: '#22C55E',
  neutral: '#2563EB',
  warning: '#F59E0B',
  negative: '#EF4444',
}

function colorForConfidence(confidence) {
  if (confidence >= 75) return LEVEL_COLOR.positive
  if (confidence >= 50) return LEVEL_COLOR.neutral
  if (confidence >= 40) return LEVEL_COLOR.warning
  return LEVEL_COLOR.negative
}

function ConfidenceGauge({ confidence, label = 'Confidence' }) {
  const value = Number.isFinite(confidence) ? Math.max(0, Math.min(100, confidence)) : 0
  const animated = useCountUp(value, 1100)
  const color = colorForConfidence(value)
  const offset = CIRCUMFERENCE - (animated / 100) * CIRCUMFERENCE

  return (
    <div
      className="flex flex-col items-center gap-2"
      role="img"
      aria-label={`${label}: ${value.toFixed(1)} percent`}
    >
      <div className="relative">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90">
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={STROKE}
          />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke 0.4s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xl font-semibold text-ink font-tabular">
            {animated.toFixed(0)}%
          </span>
        </div>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted">{label}</p>
    </div>
  )
}

export default memo(ConfidenceGauge)
