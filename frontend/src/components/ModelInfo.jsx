import { Cpu, Layers, Server } from 'lucide-react'

const ITEMS = [
  { icon: Layers, label: 'Model', value: 'facebook/wav2vec2-base' },
  { icon: Cpu, label: 'Inference Engine', value: 'PyTorch' },
  { icon: Server, label: 'Backend', value: 'FastAPI' },
]

export default function ModelInfo() {
  return (
    <div className="rounded-2xl border border-line bg-card/60 p-6">
      <p className="mb-5 font-mono text-[11px] uppercase tracking-wider text-muted">
        Model Information
      </p>
      <div className="flex flex-col gap-4">
        {ITEMS.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-muted">
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              <span className="text-[13px]">{label}</span>
            </div>
            <span className="font-mono text-[13px] text-ink">{value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
