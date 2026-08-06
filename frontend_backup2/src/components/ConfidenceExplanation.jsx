import { memo } from 'react'
import { Info } from 'lucide-react'
import { explainConfidence } from '../utils/formatters'

function ConfidenceExplanation({ confidence, prediction }) {
  const text = explainConfidence(confidence, prediction)

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-line bg-card/60 p-5">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
        <Info className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      </div>
      <p className="text-[13px] leading-relaxed text-muted">{text}</p>
    </div>
  )
}

export default memo(ConfidenceExplanation)
