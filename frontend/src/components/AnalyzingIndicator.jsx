import { useEffect, useRef, useState } from 'react'
import { Cpu, Radar, ScanLine, Sparkles, UploadCloud } from 'lucide-react'
import SoundWaveBars from './SoundWaveBars'

const STAGES = [
  { key: 'init', label: 'Initializing model', icon: Cpu },
  { key: 'upload', label: 'Extracting features', icon: UploadCloud },
  { key: 'neural', label: 'Running neural network', icon: Radar },
  { key: 'confidence', label: 'Computing confidence', icon: ScanLine },
  { key: 'finalize', label: 'Finalizing prediction', icon: Sparkles },
]

// Cadence (ms) the last three "waiting on the model" stages advance at while
// we don't have granular progress from the backend. This is purely a UX
// pacing device — it never fabricates a result, and the parent swaps this
// component out the instant the real response arrives.
const STAGE_INTERVAL_MS = 1300

export default function AnalyzingIndicator({ status, progress }) {
  const [stageIndex, setStageIndex] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    if (status === 'uploading') {
      setStageIndex(progress < 60 ? 0 : 1)
      return undefined
    }

    if (status === 'analyzing') {
      // Enter the "model is thinking" stages and step through them,
      // holding on the final stage rather than looping if it runs long.
      setStageIndex(2)
      timerRef.current = setInterval(() => {
        setStageIndex((prev) => Math.min(prev + 1, STAGES.length - 1))
      }, STAGE_INTERVAL_MS)
      return () => clearInterval(timerRef.current)
    }

    return undefined
  }, [status, progress])

  const activeStage = STAGES[stageIndex]
  const ActiveIcon = activeStage.icon

  return (
    <div className="animate-fadeUp rounded-2xl border border-line bg-card/60 px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <ActiveIcon className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <p className="text-[14px] font-medium text-ink">{activeStage.label}…</p>
        </div>
        <span className="font-mono text-[12px] text-muted">
          {status === 'uploading' ? `${progress}%` : ''}
        </span>
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-primary transition-all duration-300 ease-out"
          style={{
            width:
              status === 'uploading'
                ? `${progress}%`
                : `${20 + ((stageIndex - 1) / (STAGES.length - 2)) * 80}%`,
          }}
        />
      </div>

      <SoundWaveBars count={28} className="h-8 w-full justify-center" />

      <div className="mt-6 flex flex-col gap-2.5">
        {STAGES.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-2.5">
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-300 ${
                i < stageIndex
                  ? 'bg-primary'
                  : i === stageIndex
                    ? 'bg-primary shadow-[0_0_6px_rgba(37,99,235,0.9)]'
                    : 'bg-line'
              }`}
            />
            <span
              className={`text-[12px] transition-colors duration-300 ${
                i <= stageIndex ? 'text-muted' : 'text-muted/40'
              } ${i === stageIndex ? 'text-ink' : ''}`}
            >
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
