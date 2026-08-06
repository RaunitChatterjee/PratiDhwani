import { memo } from 'react'
import { ShieldCheck, ShieldAlert, Gauge } from 'lucide-react'
import { confidenceTier } from '../utils/formatters'
import { useCountUp } from '../hooks/useCountUp'

const TIER_STYLES = {
  high: 'bg-success/15 text-success border-success/30',
  medium: 'bg-warning/15 text-warning border-warning/30',
  low: 'bg-danger/15 text-danger border-danger/30',
  unknown: 'bg-line text-muted border-line',
}

function ConfidenceBadge({ confidence }) {
  const tier = confidenceTier(confidence)
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${TIER_STYLES[tier.level]}`}
    >
      <Gauge className="h-3 w-3" strokeWidth={2} />
      {tier.label}
    </span>
  )
}

function PredictionCard({ prediction, confidence, inferenceTimeMs }) {
  const isBonafide = prediction?.toLowerCase() === 'bonafide'
  const Icon = isBonafide ? ShieldCheck : ShieldAlert
  const animatedConfidence = useCountUp(confidence, 1000)

  return (
    <div
      className={`animate-fadeUp relative overflow-hidden rounded-2xl border p-6 transition-shadow duration-500 sm:p-8 ${
        isBonafide
          ? 'border-success/25 bg-success/[0.06] hover:shadow-[0_0_40px_-12px_rgba(34,197,94,0.35)]'
          : 'border-danger/25 bg-danger/[0.06] hover:shadow-[0_0_40px_-12px_rgba(239,68,68,0.35)]'
      }`}
    >
      <div
        className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${
          isBonafide ? 'bg-success/10' : 'bg-danger/10'
        }`}
      />

      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Forensic Verdict
          </p>
          <h2
            className={`mt-2 font-display text-4xl font-bold tracking-tight sm:text-5xl ${
              isBonafide ? 'text-success' : 'text-danger'
            }`}
          >
            {isBonafide ? 'BONAFIDE' : 'SPOOF'}
          </h2>
          <p className="mt-2 text-[13px] text-muted">
            {isBonafide
              ? 'No synthetic artifacts detected in this recording.'
              : 'Synthetic generation artifacts detected in this recording.'}
          </p>
          <div className="mt-4">
            <ConfidenceBadge confidence={confidence} />
          </div>
        </div>

        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
            isBonafide ? 'bg-success/15' : 'bg-danger/15'
          }`}
        >
          <Icon className={`h-7 w-7 ${isBonafide ? 'text-success' : 'text-danger'}`} strokeWidth={1.75} />
        </div>
      </div>

      <div className="relative mt-8 flex items-end justify-between border-t border-line pt-5">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Confidence</p>
          <p className="font-mono text-3xl font-semibold text-ink font-tabular">
            {animatedConfidence.toFixed(2)}%
          </p>
        </div>
        {inferenceTimeMs !== null && inferenceTimeMs !== undefined && (
          <div className="text-right">
            <p className="font-mono text-[11px] uppercase tracking-wider text-muted">Inference</p>
            <p className="font-mono text-[15px] text-ink">{inferenceTimeMs} ms</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default memo(PredictionCard)
