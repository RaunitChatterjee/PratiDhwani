import EchoRings from './EchoRings'

export default function Hero() {
  return (
    <section id="overview" className="relative overflow-hidden border-b border-line">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-14 sm:px-6 sm:py-16 md:py-24 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8">
        <div className="animate-fadeUp text-center lg:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted sm:text-[11px]">
              Wav2Vec2 · ASVspoof-trained
            </span>
          </div>

          <h1 className="font-display text-[2.25rem] font-semibold leading-[1.1] tracking-tight text-ink sm:text-4xl md:text-5xl">
            Every voice
            <br />
            leaves an echo.
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-[14px] leading-relaxed text-muted sm:text-[15px] lg:mx-0">
            PratiDhwani listens for what synthetic speech can't hide — the
            micro-artifacts left behind when a voice is generated instead of
            spoken. Upload a recording and get a forensic verdict in seconds.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-[12px] text-muted sm:gap-6 sm:text-[13px] lg:justify-start">
            <div>
              <p className="font-mono text-lg font-medium text-ink sm:text-xl">2</p>
              <p>Class Verdict</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="font-mono text-lg font-medium text-ink sm:text-xl">.wav / .flac</p>
              <p>Supported Formats</p>
            </div>
            <div className="h-8 w-px bg-line" />
            <div>
              <p className="font-mono text-lg font-medium text-ink sm:text-xl">Local</p>
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
