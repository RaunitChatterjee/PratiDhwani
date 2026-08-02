import { memo } from 'react'
import { formatPercent } from '../utils/formatters'
import { useCountUp } from '../hooks/useCountUp'

function Bar({ label, value, colorClass, delay = 0 }) {
  const animated = useCountUp(value, 900)

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[13px] font-medium text-ink">{label}</span>
        <span className="font-mono text-[13px] text-muted font-tabular">
          {formatPercent(animated)}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-bg">
        <div
          className={`h-full rounded-full ${colorClass} transition-[width] duration-[900ms] ease-out`}
          style={{ width: `${value ?? 0}%`, transitionDelay: `${delay}ms` }}
        />
      </div>
    </div>
  )
}

function ProbabilityBars({ bonafide, spoof }) {
  return (
    <div className="animate-fadeUp rounded-2xl border border-line bg-card/60 p-6">
      <p className="mb-5 font-mono text-[11px] uppercase tracking-wider text-muted">
        Class Probability
      </p>
      <div className="flex flex-col gap-5">
        <Bar label="Bonafide (Human)" value={bonafide} colorClass="bg-success" delay={0} />
        <Bar label="Spoof (AI Generated)" value={spoof} colorClass="bg-danger" delay={120} />
      </div>
    </div>
  )
}

export default memo(ProbabilityBars)
