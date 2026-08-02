import { ShieldCheck, ShieldAlert } from 'lucide-react'
import { formatPercent } from '../utils/formatters'

export default function PredictionCard({ prediction, confidence, inferenceTimeMs }) {
  const isBonafide = prediction?.toLowerCase() === 'bonafide'

  const accent = isBonafide ? 'success' : 'danger'
  const Icon = isBonafide ? ShieldCheck : ShieldAlert

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-8 ${
        isBonafide ? 'border-success/25 bg-success/[0.06]' : 'border-danger/25 bg-danger/[0.06]'
      }`}
    >
      <div
        className={`absolute -right-10 -top-10 h-40 w-40 rounded-full blur-3xl ${
          isBonafide ? 'bg-success/10' : 'bg-danger/10'
        }`}
      />

      <div className="relative flex items-start justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
            Forensic Verdict
          </p>
          <h2
            className={`mt-2 font-display text-5xl font-bold tracking-tight ${
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
          <p className="font-mono text-3xl font-semibold text-ink">{formatPercent(confidence)}</p>
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
