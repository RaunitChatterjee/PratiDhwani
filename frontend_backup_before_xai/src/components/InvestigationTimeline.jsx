import { useEffect, useRef, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import SoundWaveBars from './SoundWaveBars'

const STEPS = [
  { key: 'uploaded', label: 'Audio uploaded' },
  { key: 'features', label: 'Feature extraction completed' },
  { key: 'inference', label: 'Neural inference completed' },
  { key: 'confidence', label: 'Confidence calculated' },
  { key: 'report', label: 'Report generated' },
]

// Cadence for the two "model is thinking" steps we don't have granular
// backend progress for. Purely a pacing device for the UI — it never
// blocks or delays the real result, and step 5 only completes once the
// actual response (and report) is ready.
const STEP_INTERVAL_MS = 1300

export default function InvestigationTimeline({ status, progress, reportReady }) {
  const [completedCount, setCompletedCount] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (status === 'uploading') {
      setCompletedCount(progress >= 100 ? 1 : 0)
      return undefined
    }

    if (status === 'analyzing') {
      setCompletedCount((c) => Math.max(c, 1))
      timerRef.current = setInterval(() => {
        setCompletedCount((prev) => Math.min(prev + 1, 3))
      }, STEP_INTERVAL_MS)
      return () => clearInterval(timerRef.current)
    }

    if (status === 'done') {
      setCompletedCount(reportReady ? 5 : 4)
    }

    return undefined
  }, [status, progress, reportReady])

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`Analysis progress: ${STEPS[Math.min(completedCount, STEPS.length - 1)]?.label}`}
      className="animate-fadeUp rounded-2xl border border-line bg-card/60 px-6 py-7"
    >
      {status !== 'done' && (
        <>
          <SoundWaveBars count={28} className="mb-6 h-8 w-full justify-center" />
        </>
      )}

      <ol className="flex flex-col gap-4">
        {STEPS.map((step, i) => {
          const isComplete = i < completedCount
          const isActive = i === completedCount && status !== 'done'

          return (
            <li key={step.key} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ${
                  isComplete
                    ? 'border-success bg-success/15 text-success'
                    : isActive
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-line text-muted/40'
                }`}
              >
                {isComplete ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden="true" />
                ) : isActive ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                )}
              </span>
              <span
                className={`text-[13px] transition-colors duration-300 ${
                  isComplete ? 'text-ink' : isActive ? 'text-ink' : 'text-muted/50'
                }`}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
