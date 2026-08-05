import { memo } from 'react'
import {
  Microscope,
  ShieldCheck,
  Shield,
  ShieldAlert,
  Activity,
  AlertTriangle,
  Clock,
  Sparkles,
  FileWarning,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react'
import ConfidenceGauge from './ConfidenceGauge'
import IndicatorMeaningsAccordion from './IndicatorMeaningsAccordion'

const ICONS = {
  'shield-check': ShieldCheck,
  shield: Shield,
  'shield-alert': ShieldAlert,
  activity: Activity,
  'alert-triangle': AlertTriangle,
  clock: Clock,
  sparkles: Sparkles,
  'file-warning': FileWarning,
  'check-circle': CheckCircle,
  'help-circle': HelpCircle,
}

const LEVEL_STYLES = {
  positive: 'border-success/25 bg-success/[0.06] text-success',
  neutral: 'border-primary/25 bg-primary/[0.06] text-primary',
  warning: 'border-warning/25 bg-warning/[0.06] text-warning',
  negative: 'border-danger/25 bg-danger/[0.06] text-danger',
}

const TAG_STYLES = {
  'Very High': 'bg-success/15 text-success',
  High: 'bg-success/15 text-success',
  Medium: 'bg-warning/15 text-warning',
  Low: 'bg-danger/15 text-danger',
  'Very Low': 'bg-danger/15 text-danger',
  Unknown: 'bg-line text-muted',
  Excellent: 'bg-success/15 text-success',
  Good: 'bg-success/15 text-success',
  Fair: 'bg-warning/15 text-warning',
  Poor: 'bg-danger/15 text-danger',
}

function Tag({ value }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${TAG_STYLES[value] || 'bg-line text-muted'}`}
    >
      {value}
    </span>
  )
}

function IndicatorItem({ indicator }) {
  const Icon = ICONS[indicator.icon] || HelpCircle
  return (
    <li
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${LEVEL_STYLES[indicator.level] || LEVEL_STYLES.neutral}`}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div>
        <p className="text-[13px] font-medium text-ink">{indicator.title}</p>
        <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{indicator.description}</p>
      </div>
    </li>
  )
}

function ForensicExplanationCard({ explanation, confidence }) {
  if (!explanation) return null

  const { summary, classification, reliability, audioQuality, indicators, notes } = explanation

  return (
    <section
      aria-labelledby="forensic-explanation-heading"
      className="animate-fadeUp rounded-2xl border border-line bg-card/60 p-6"
    >
      <div className="mb-1 flex items-center gap-2">
        <Microscope className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3
          id="forensic-explanation-heading"
          className="font-mono text-[11px] uppercase tracking-wider text-muted"
        >
          Forensic Explanation
        </h3>
      </div>
      <p className="mb-5 flex items-start gap-1.5 text-[11px] leading-relaxed text-muted/80">
        <Info className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
        The indicators below are heuristic supporting context derived from confidence and
        recording metadata — they are not direct outputs of the neural network.
      </p>

      <div className="grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
        <div className="flex justify-center sm:justify-start">
          <ConfidenceGauge confidence={confidence} />
        </div>
        <div>
          <p className="text-[13px] leading-relaxed text-ink">{summary}</p>
          <div className="mt-3 flex flex-wrap gap-4">
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                Confidence Class
              </p>
              <Tag value={classification} />
            </div>
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                Prediction Reliability
              </p>
              <Tag value={reliability} />
            </div>
            <div>
              <p className="mb-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                Recording Quality
              </p>
              <Tag value={audioQuality.label} />
            </div>
          </div>
        </div>
      </div>

      <div className="my-6 border-t border-line" />

      <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted">
        Supporting Indicators
      </p>
      <ul className="grid gap-2.5 sm:grid-cols-2">
        {indicators.map((indicator) => (
          <IndicatorItem key={indicator.id} indicator={indicator} />
        ))}
      </ul>

      <div className="mt-5">
        <IndicatorMeaningsAccordion indicators={indicators} />
      </div>

      <div className="mt-5 rounded-xl border border-line bg-bg px-4 py-3.5">
        <p className="mb-1.5 font-mono text-[10px] uppercase tracking-wider text-muted">
          Forensic Notes
        </p>
        <p className="text-[12.5px] leading-relaxed text-muted">{notes}</p>
      </div>
    </section>
  )
}

export default memo(ForensicExplanationCard)
