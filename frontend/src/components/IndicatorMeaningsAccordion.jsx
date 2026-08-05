import { memo } from 'react'
import { ChevronDown } from 'lucide-react'
import { INDICATOR_MEANINGS } from '../utils/forensicExplanation'

function IndicatorMeaningsAccordion({ indicators }) {
  return (
    <details className="group rounded-xl border border-line bg-bg">
      <summary
        className="flex cursor-pointer list-none items-center justify-between gap-2 px-4 py-3 text-[13px] font-medium text-ink outline-none transition-colors hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
        aria-label="What do these indicators mean? Expand for details."
      >
        What do these indicators mean?
        <ChevronDown
          className="h-4 w-4 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <div className="flex flex-col gap-4 border-t border-line px-4 py-4">
        {indicators.map((indicator) => (
          <div key={indicator.id}>
            <p className="text-[12.5px] font-medium text-ink">{indicator.title}</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted">
              {INDICATOR_MEANINGS[indicator.id] ||
                'This indicator is derived heuristically from confidence and metadata, not from the model directly.'}
            </p>
          </div>
        ))}
      </div>
    </details>
  )
}

export default memo(IndicatorMeaningsAccordion)
