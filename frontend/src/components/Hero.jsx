import EchoRings from './EchoRings'

export default function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-line">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="animate-fadeUp">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
              Wav2Vec2 · ASVspoof-trained
            </span>
          </div>

          <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink md:text-5xl">
            Every voice
            <br />
            leaves an echo.
          </h1>

          <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-muted">
            PratiDhwani listens for what synthetic speech can't hide — the
            micro-artifacts left behind when a voice is generated instead of
            spoken. Upload a recording and get a forensic verdict in seconds.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-6 text-[13px] text-muted">
            <div>
              <p className="font-mono text-xl font-medium text-ink">2</p>
              <p>Class Verdict</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="font-mono text-xl font-medium text-ink">.wav / .flac</p>
              <p>Supported Formats</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="font-mono text-xl font-medium text-ink">Local</p>
              <p>Inference, No Cloud</p>
            </div>
          </div>
        </div>

        <div className="relative flex items-center justify-center">
          <EchoRings />
        </div>
      </div>
    </section>
  )
}
