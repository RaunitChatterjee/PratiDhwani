const STAGES = [
  { key: 'uploading', label: 'Uploading recording' },
  { key: 'analyzing', label: 'Extracting spectral features' },
]

export default function AnalyzingIndicator({ status, progress }) {
  const activeIndex = status === 'uploading' ? 0 : 1

  return (
    <div className="animate-fadeUp rounded-2xl border border-line bg-card/60 px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <p className="text-[14px] font-medium text-ink">
          {status === 'uploading' ? 'Uploading audio…' : 'Analyzing waveform…'}
        </p>
        <span className="font-mono text-[12px] text-muted">
          {status === 'uploading' ? `${progress}%` : ''}
        </span>
      </div>

      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-primary transition-all duration-200 ease-out"
          style={{
            width: status === 'uploading' ? `${progress}%` : '100%',
          }}
        />
      </div>

      <div className="flex items-center gap-2">
        {Array.from({ length: 28 }).map((_, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-primary/60"
            style={{
              height: 6 + Math.abs(Math.sin(i * 0.9)) * 22,
              animation: `pulseBar 1.1s ease-in-out ${i * 0.035}s infinite alternate`,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes pulseBar {
          0% { opacity: 0.35; transform: scaleY(0.6); }
          100% { opacity: 1; transform: scaleY(1); }
        }
      `}</style>

      <div className="mt-6 flex flex-col gap-2">
        {STAGES.map((stage, i) => (
          <div key={stage.key} className="flex items-center gap-2.5">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                i <= activeIndex ? 'bg-primary' : 'bg-line'
              }`}
            />
            <span
              className={`text-[12px] ${i <= activeIndex ? 'text-muted' : 'text-muted/50'}`}
            >
              {stage.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
