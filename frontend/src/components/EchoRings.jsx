// Signature visual: concentric arcs radiating from a central mic point,
// evoking sonar/echo — a literal nod to "PratiDhwani" (echo) and to a
// waveform being pulled apart for forensic inspection.
export default function EchoRings() {
  const rings = [64, 96, 128, 160]

  return (
    <div className="relative flex h-72 w-72 items-center justify-center md:h-80 md:w-80">
      {rings.map((r, i) => (
        <span
          key={r}
          className="absolute rounded-full border border-primary/25"
          style={{
            width: r * 2,
            height: r * 2,
            animation: `pulseRing 3s cubic-bezier(0.4,0,0.6,1) ${i * 0.6}s infinite`,
          }}
        />
      ))}

      <div className="absolute h-40 w-40 rounded-full bg-primary/10 blur-2xl" />

      <div className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full border border-primary/40 bg-card shadow-glow">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="text-primary">
          <path
            d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z"
            stroke="currentColor"
            strokeWidth="1.6"
          />
          <path
            d="M19 11a7 7 0 01-14 0M12 18v3"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <svg
        className="absolute inset-0 h-full w-full -rotate-90 text-primary/50"
        viewBox="0 0 320 320"
        fill="none"
      >
        <circle
          cx="160"
          cy="160"
          r="140"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="2 10"
          strokeLinecap="round"
        />
      </svg>
    </div>
  )
}
