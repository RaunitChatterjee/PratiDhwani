import { memo } from 'react'
import { CheckCircle2, Clock, Waves } from 'lucide-react'

// Static roster of the PratiDhwani ensemble's registered models. Only
// Wav2Vec2 is implemented today — AASIST and RawNet2 are shown as
// upcoming so the multi-model architecture is visible in the UI ahead of
// their backend implementations landing.
const MODELS = [
  {
    id: 'wav2vec2',
    name: 'Wav2Vec2',
    description: 'Transformer-based speech encoder, fine-tuned on ASVspoof 2019 LA.',
    status: 'active',
  },
  {
    id: 'aasist',
    name: 'AASIST',
    description: 'Graph attention network for spoof detection.',
    status: 'coming_soon',
  },
  {
    id: 'rawnet2',
    name: 'RawNet2',
    description: 'Raw-waveform CNN spoof detector.',
    status: 'coming_soon',
  },
]

function StatusBadge({ status }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-1 text-[11px] font-medium text-success">
        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
        Active
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-line px-2.5 py-1 text-[11px] font-medium text-muted">
      <Clock className="h-3 w-3" aria-hidden="true" />
      Coming Soon
    </span>
  )
}

function ModelRow({ model }) {
  const isActive = model.status === 'active'
  return (
    <li
      className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition-colors ${
        isActive ? 'border-primary/20 bg-primary/[0.04]' : 'border-line bg-bg/40'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            isActive ? 'bg-primary/15' : 'bg-line'
          }`}
        >
          <Waves
            className={`h-3.5 w-3.5 ${isActive ? 'text-primary' : 'text-muted'}`}
            aria-hidden="true"
          />
        </div>
        <div>
          <p className={`text-[13px] font-medium ${isActive ? 'text-ink' : 'text-muted'}`}>
            {model.name}
          </p>
          <p className="mt-0.5 text-[11.5px] leading-relaxed text-muted/80">
            {model.description}
          </p>
        </div>
      </div>
      <StatusBadge status={model.status} />
    </li>
  )
}

function ModelResultsPanel() {
  return (
    <section
      aria-labelledby="model-results-heading"
      className="rounded-2xl border border-line bg-card/60 p-6 transition-colors duration-300 hover:border-primary/15"
    >
      <div className="mb-4 flex items-center justify-between">
        <p
          id="model-results-heading"
          className="font-mono text-[11px] uppercase tracking-wider text-muted"
        >
          Model Results
        </p>
        <span className="font-mono text-[10px] text-muted/60">1 of 3 active</span>
      </div>

      <ul className="flex flex-col gap-2.5">
        {MODELS.map((model) => (
          <ModelRow key={model.id} model={model} />
        ))}
      </ul>

      <p className="mt-4 text-[11px] leading-relaxed text-muted/70">
        PratiDhwani is built as a multi-model ensemble. Today's prediction comes solely from
        Wav2Vec2 — AASIST and RawNet2 will be aggregated in automatically once implemented.
      </p>
    </section>
  )
}

export default memo(ModelResultsPanel)
