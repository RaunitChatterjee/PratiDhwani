import { AudioLines } from 'lucide-react'
import { useBackendStatus } from '../hooks/useBackendStatus'

export default function Navbar() {
  const online = useBackendStatus()

  const statusLabel = online === null ? 'Checking' : online ? 'Engine Online' : 'Engine Offline'
  const statusColor =
    online === null ? 'bg-warning' : online ? 'bg-success' : 'bg-danger'

  return (
    <header className="sticky top-0 z-50 border-b border-line glass">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
            <AudioLines className="h-5 w-5 text-primary" strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
              PratiDhwani
            </p>
            <p className="text-[11px] text-muted">Audio Forensics Lab</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-line bg-card/60 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full ${statusColor} opacity-60`}
            />
            <span className={`relative inline-flex h-2 w-2 rounded-full ${statusColor}`} />
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
            {statusLabel}
          </span>
        </div>
      </div>
    </header>
  )
}
